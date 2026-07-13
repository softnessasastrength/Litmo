import ExpoModulesCore
import MultipeerConnectivity
import UIKit

/**
 * Thin Multipeer Connectivity bridge for intentional nearby share.
 *
 * Consent, payload policy, and application-layer encryption live in TypeScript.
 * This module only discovers peers, connects after explicit accept, and moves
 * opaque data. It never decides what is shared or whether consent is granted.
 */
public final class LitmoLocalShareModule: Module {
  private let session = LocalShareSession()

  public func definition() -> ModuleDefinition {
    Name("LitmoLocalShare")

    Events(
      "onPeerFound",
      "onPeerLost",
      "onInvitation",
      "onPeerConnected",
      "onPeerDisconnected",
      "onData",
      "onError",
      "onStopped"
    )

    AsyncFunction("isAvailableAsync") { () -> Bool in
      #if targetEnvironment(simulator)
      // Multipeer can work on simulator for same-host testing, but LAN
      // permissions and radio behavior differ. Report available; JS still
      // owns product messaging.
      return true
      #else
      return true
      #endif
    }

    AsyncFunction("startAdvertisingAsync") { (options: [String: Any], promise: Promise) in
      do {
        try self.session.startAdvertising(options: options) { event, body in
          self.sendEvent(event, body)
        }
        promise.resolve(true)
      } catch {
        promise.reject("ERR_LOCAL_SHARE_START", error.localizedDescription)
      }
    }

    AsyncFunction("startBrowsingAsync") { (options: [String: Any], promise: Promise) in
      do {
        try self.session.startBrowsing(options: options) { event, body in
          self.sendEvent(event, body)
        }
        promise.resolve(true)
      } catch {
        promise.reject("ERR_LOCAL_SHARE_START", error.localizedDescription)
      }
    }

    AsyncFunction("invitePeerAsync") { (peerId: String, promise: Promise) in
      do {
        try self.session.invite(peerId: peerId)
        promise.resolve(true)
      } catch {
        promise.reject("ERR_LOCAL_SHARE_INVITE", error.localizedDescription)
      }
    }

    AsyncFunction("respondToInvitationAsync") { (peerId: String, accept: Bool, promise: Promise) in
      do {
        try self.session.respondToInvitation(peerId: peerId, accept: accept)
        promise.resolve(true)
      } catch {
        promise.reject("ERR_LOCAL_SHARE_INVITE", error.localizedDescription)
      }
    }

    AsyncFunction("sendDataAsync") { (peerId: String, utf8Payload: String, promise: Promise) in
      do {
        try self.session.send(peerId: peerId, utf8Payload: utf8Payload)
        promise.resolve(true)
      } catch {
        promise.reject("ERR_LOCAL_SHARE_SEND", error.localizedDescription)
      }
    }

    AsyncFunction("stopAsync") { (promise: Promise) in
      self.session.stop { event, body in
        self.sendEvent(event, body)
      }
      promise.resolve(true)
    }
  }
}

private enum LocalShareError: LocalizedError {
  case invalidOptions
  case alreadyActive
  case notActive
  case unknownPeer
  case sendFailed

  var errorDescription: String? {
    switch self {
    case .invalidOptions: return "Nearby share options were invalid."
    case .alreadyActive: return "A nearby share radio is already active. Stop it first."
    case .notActive: return "Nearby share is not active."
    case .unknownPeer: return "That nearby peer is no longer available."
    case .sendFailed: return "Could not send data to the nearby peer."
    }
  }
}

private final class LocalShareSession: NSObject {
  private var peerID: MCPeerID?
  private var session: MCSession?
  private var advertiser: MCNearbyServiceAdvertiser?
  private var browser: MCNearbyServiceBrowser?
  private var emit: ((String, [String: Any]) -> Void)?
  private var pendingInvitations: [String: (Bool, MCSession?) -> Void] = [:]
  private var discovered: [String: MCPeerID] = [:]
  private let serviceType = "litmo-share"
  private let queue = DispatchQueue(label: "com.litmo.local-share")

  func startAdvertising(options: [String: Any], emit: @escaping (String, [String: Any]) -> Void) throws {
    try queue.sync {
      guard self.session == nil else { throw LocalShareError.alreadyActive }
      guard let displayName = options["displayName"] as? String, !displayName.isEmpty else {
        throw LocalShareError.invalidOptions
      }
      self.emit = emit
      let peer = MCPeerID(displayName: String(displayName.prefix(63)))
      let session = MCSession(peer: peer, securityIdentity: nil, encryptionPreference: .required)
      session.delegate = self
      var discoveryInfo: [String: String] = ["role": "host"]
      if let kind = options["shareKind"] as? String {
        discoveryInfo["kind"] = String(kind.prefix(32))
      }
      if let label = options["discoveryLabel"] as? String {
        discoveryInfo["label"] = String(label.prefix(24))
      }
      let advertiser = MCNearbyServiceAdvertiser(
        peer: peer,
        discoveryInfo: discoveryInfo,
        serviceType: serviceType
      )
      advertiser.delegate = self
      self.peerID = peer
      self.session = session
      self.advertiser = advertiser
      advertiser.startAdvertisingPeer()
    }
  }

  func startBrowsing(options: [String: Any], emit: @escaping (String, [String: Any]) -> Void) throws {
    try queue.sync {
      guard self.session == nil else { throw LocalShareError.alreadyActive }
      guard let displayName = options["displayName"] as? String, !displayName.isEmpty else {
        throw LocalShareError.invalidOptions
      }
      self.emit = emit
      let peer = MCPeerID(displayName: String(displayName.prefix(63)))
      let session = MCSession(peer: peer, securityIdentity: nil, encryptionPreference: .required)
      session.delegate = self
      let browser = MCNearbyServiceBrowser(peer: peer, serviceType: serviceType)
      browser.delegate = self
      self.peerID = peer
      self.session = session
      self.browser = browser
      browser.startBrowsingForPeers()
    }
  }

  func invite(peerId: String) throws {
    try queue.sync {
      guard let browser = self.browser, let session = self.session else {
        throw LocalShareError.notActive
      }
      guard let peer = self.discovered[peerId] else { throw LocalShareError.unknownPeer }
      browser.invitePeer(peer, to: session, withContext: nil, timeout: 30)
    }
  }

  func respondToInvitation(peerId: String, accept: Bool) throws {
    try queue.sync {
      guard let handler = self.pendingInvitations.removeValue(forKey: peerId) else {
        throw LocalShareError.unknownPeer
      }
      handler(accept, accept ? self.session : nil)
    }
  }

  func send(peerId: String, utf8Payload: String) throws {
    try queue.sync {
      guard let session = self.session else { throw LocalShareError.notActive }
      guard let peer = session.connectedPeers.first(where: {
        self.peerKey($0) == peerId || $0.displayName == peerId
      }) else {
        throw LocalShareError.unknownPeer
      }
      try self.sendData(utf8Payload, to: [peer], session: session)
    }
  }

  func stop(emit: @escaping (String, [String: Any]) -> Void) {
    queue.sync {
      self.advertiser?.stopAdvertisingPeer()
      self.browser?.stopBrowsingForPeers()
      self.session?.disconnect()
      self.advertiser = nil
      self.browser = nil
      self.session = nil
      self.peerID = nil
      self.discovered.removeAll()
      self.pendingInvitations.removeAll()
      self.emit = emit
      emit("onStopped", ["reason": "user"])
      self.emit = nil
    }
  }

  private func sendData(_ utf8Payload: String, to peers: [MCPeerID], session: MCSession) throws {
    guard let data = utf8Payload.data(using: .utf8) else { throw LocalShareError.sendFailed }
    do {
      try session.send(data, toPeers: peers, with: .reliable)
    } catch {
      throw LocalShareError.sendFailed
    }
  }

  private func peerKey(_ peer: MCPeerID) -> String {
    peer.displayName
  }

  private func emitEvent(_ name: String, _ body: [String: Any]) {
    DispatchQueue.main.async {
      self.emit?(name, body)
    }
  }
}

extension LocalShareSession: MCSessionDelegate {
  func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
    let key = peerKey(peerID)
    switch state {
    case .connected:
      emitEvent("onPeerConnected", ["peerId": key, "displayName": peerID.displayName])
    case .notConnected:
      emitEvent("onPeerDisconnected", ["peerId": key, "displayName": peerID.displayName])
    case .connecting:
      break
    @unknown default:
      break
    }
  }

  func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
    guard let text = String(data: data, encoding: .utf8) else { return }
    emitEvent("onData", [
      "peerId": peerKey(peerID),
      "displayName": peerID.displayName,
      "payload": text,
    ])
  }

  func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) {}
  func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) {}
  func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}
}

extension LocalShareSession: MCNearbyServiceAdvertiserDelegate {
  func advertiser(
    _ advertiser: MCNearbyServiceAdvertiser,
    didReceiveInvitationFromPeer peerID: MCPeerID,
    withContext context: Data?,
    invitationHandler: @escaping (Bool, MCSession?) -> Void
  ) {
    let key = peerKey(peerID)
    pendingInvitations[key] = invitationHandler
    emitEvent("onInvitation", [
      "peerId": key,
      "displayName": peerID.displayName,
    ])
  }

  func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didNotStartAdvertisingPeer error: Error) {
    emitEvent("onError", ["message": error.localizedDescription, "code": "advertise_failed"])
  }
}

extension LocalShareSession: MCNearbyServiceBrowserDelegate {
  func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo info: [String: String]?) {
    let key = peerKey(peerID)
    discovered[key] = peerID
    emitEvent("onPeerFound", [
      "peerId": key,
      "displayName": peerID.displayName,
      "discoveryLabel": info?["label"] as Any,
      "shareKind": info?["kind"] as Any,
      "role": info?["role"] as Any,
    ])
  }

  func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {
    let key = peerKey(peerID)
    discovered.removeValue(forKey: key)
    emitEvent("onPeerLost", [
      "peerId": key,
      "displayName": peerID.displayName,
    ])
  }

  func browser(_ browser: MCNearbyServiceBrowser, didNotStartBrowsingForPeers error: Error) {
    emitEvent("onError", ["message": error.localizedDescription, "code": "browse_failed"])
  }
}
