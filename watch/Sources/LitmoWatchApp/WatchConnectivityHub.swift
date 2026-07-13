import Foundation
import LitmoWatchHaptics

#if canImport(WatchConnectivity)
import WatchConnectivity
#endif

/// Watch Connectivity hub — Soft Signal kill + session id only.
/// Never social feed. Never peer display names on the face.
public final class WatchConnectivityHub: NSObject, @unchecked Sendable {
  public static let shared = WatchConnectivityHub()

  public let localDeviceId: String
  public var onSessionId: ((String?) -> Void)?
  public var onSoftSignalKillFromPhone: (() -> Void)?

  private override init() {
    if let cached = UserDefaults.standard.string(forKey: "litmo.watch.deviceId") {
      localDeviceId = cached
    } else {
      let id = UUID().uuidString
      UserDefaults.standard.set(id, forKey: "litmo.watch.deviceId")
      localDeviceId = id
    }
    super.init()
  }

  public func activate() {
    #if canImport(WatchConnectivity)
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    session.delegate = self
    session.activate()
    #endif
  }

  public func sendSoftSignalKill(_ command: LitmoSoftSignalKillCommand) {
    #if canImport(WatchConnectivity)
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    guard let data = try? JSONEncoder().encode(command),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return }
    let payload: [String: Any] = ["litmo": "soft_signal_kill", "command": json]
    if session.isReachable {
      session.sendMessage(payload, replyHandler: nil, errorHandler: { _ in
        session.transferUserInfo(payload)
      })
    } else {
      session.transferUserInfo(payload)
    }
    #else
    _ = command
    #endif
  }
}

#if canImport(WatchConnectivity)
extension WatchConnectivityHub: WCSessionDelegate {
  public func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    _ = (session, activationState, error)
  }

  public func session(
    _ session: WCSession,
    didReceiveMessage message: [String: Any]
  ) {
    handle(message)
  }

  public func session(
    _ session: WCSession,
    didReceiveUserInfo userInfo: [String: Any] = [:]
  ) {
    handle(userInfo)
  }

  private func handle(_ message: [String: Any]) {
    guard let kind = message["litmo"] as? String else { return }
    if kind == "session_id" {
      let id = message["sessionId"] as? String
      onSessionId?(id)
    }
    if kind == "soft_signal_kill" {
      onSoftSignalKillFromPhone?()
    }
    if kind == "haptic_preview", let lexemeRaw = message["lexeme"] as? String,
       let lexeme = LitmoWatchLexeme(rawValue: lexemeRaw)
    {
      LitmoTapticPlayer().play(lexeme: lexeme, intensityScale: 0.4)
    }
  }

  #if os(iOS)
  public func sessionDidBecomeInactive(_ session: WCSession) {}
  public func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }
  #endif
}
#endif
