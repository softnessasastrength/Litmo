import CoreNFC
import ExpoModulesCore
import UIKit

/**
 * Thin Core NFC bridge for Litmo tap-to-connect.
 *
 * Phone-to-phone P2P NFC is not available to third-party iOS apps.
 * This module reads and writes NDEF tags (and scans tags held near the phone).
 * Application consent and E2E crypto live in TypeScript — a tap alone never
 * grants consent.
 */
public final class LitmoNfcModule: Module {
  private let coordinator = NfcCoordinator()

  public func definition() -> ModuleDefinition {
    Name("LitmoNfc")

    Events("onNdefRead", "onNdefWrite", "onError", "onSessionInvalidated")

    AsyncFunction("isAvailableAsync") { () -> Bool in
      return NFCNDEFReaderSession.readingAvailable
    }

    AsyncFunction("isWritingAvailableAsync") { () -> Bool in
      if #available(iOS 13.0, *) {
        return NFCNDEFReaderSession.readingAvailable
      }
      return false
    }

    AsyncFunction("beginReadAsync") { (alertMessage: String?, promise: Promise) in
      guard NFCNDEFReaderSession.readingAvailable else {
        return promise.reject("ERR_NFC_UNAVAILABLE", "NFC reading is not available on this device.")
      }
      do {
        try self.coordinator.beginRead(alertMessage: alertMessage) { event, body in
          self.sendEvent(event, body)
        }
        promise.resolve(true)
      } catch {
        promise.reject("ERR_NFC_READ", error.localizedDescription)
      }
    }

    AsyncFunction("beginWriteAsync") { (payload: String, alertMessage: String?, promise: Promise) in
      guard NFCNDEFReaderSession.readingAvailable else {
        return promise.reject("ERR_NFC_UNAVAILABLE", "NFC writing is not available on this device.")
      }
      do {
        try self.coordinator.beginWrite(payload: payload, alertMessage: alertMessage) { event, body in
          self.sendEvent(event, body)
        }
        promise.resolve(true)
      } catch {
        promise.reject("ERR_NFC_WRITE", error.localizedDescription)
      }
    }

    AsyncFunction("invalidateAsync") { (promise: Promise) in
      self.coordinator.invalidate()
      promise.resolve(true)
    }
  }
}

private enum NfcError: LocalizedError {
  case busy
  case invalidPayload
  case notSupported

  var errorDescription: String? {
    switch self {
    case .busy: return "An NFC session is already active. Cancel it first."
    case .invalidPayload: return "NFC payload was empty or invalid."
    case .notSupported: return "NFC is not supported on this device."
    }
  }
}

private final class NfcCoordinator: NSObject {
  private var session: NFCNDEFReaderSession?
  private var mode: Mode = .idle
  private var writePayload: String?
  private var emit: ((String, [String: Any]) -> Void)?

  private enum Mode {
    case idle, reading, writing
  }

  func beginRead(alertMessage: String?, emit: @escaping (String, [String: Any]) -> Void) throws {
    guard session == nil else { throw NfcError.busy }
    guard NFCNDEFReaderSession.readingAvailable else { throw NfcError.notSupported }
    self.emit = emit
    self.mode = .reading
    self.writePayload = nil
    let session = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: true)
    session.alertMessage = alertMessage
      ?? "Hold your iPhone near the Litmo NFC tag. A tap is never consent — you will confirm next."
    self.session = session
    session.begin()
  }

  func beginWrite(payload: String, alertMessage: String?, emit: @escaping (String, [String: Any]) -> Void) throws {
    guard session == nil else { throw NfcError.busy }
    guard NFCNDEFReaderSession.readingAvailable else { throw NfcError.notSupported }
    guard !payload.isEmpty, payload.utf8.count < 7000 else { throw NfcError.invalidPayload }
    self.emit = emit
    self.mode = .writing
    self.writePayload = payload
    let session = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: false)
    session.alertMessage = alertMessage
      ?? "Hold your iPhone near a writable NFC tag to place a Litmo invite. You can still cancel."
    self.session = session
    session.begin()
  }

  func invalidate() {
    session?.invalidate()
    session = nil
    mode = .idle
    writePayload = nil
  }

  private func emitEvent(_ name: String, _ body: [String: Any]) {
    DispatchQueue.main.async {
      self.emit?(name, body)
    }
  }
}

extension NfcCoordinator: NFCNDEFReaderSessionDelegate {
  func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
    let ns = error as NSError
    // User cancel is not a hard failure for product flow.
    if ns.domain == NFCErrorDomain,
       ns.code == NFCReaderError.readerSessionInvalidationErrorUserCanceled.rawValue {
      emitEvent("onSessionInvalidated", ["reason": "user_canceled"])
    } else if ns.domain == NFCErrorDomain,
              ns.code == NFCReaderError.readerSessionInvalidationErrorFirstNDEFTagRead.rawValue {
      emitEvent("onSessionInvalidated", ["reason": "complete"])
    } else {
      emitEvent("onError", [
        "message": error.localizedDescription,
        "code": "session_invalidated",
      ])
      emitEvent("onSessionInvalidated", ["reason": "error"])
    }
    self.session = nil
    self.mode = .idle
    self.writePayload = nil
  }

  func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
    // Used when invalidateAfterFirstRead is true (read path).
    guard mode == .reading else { return }
    if let text = firstText(from: messages) {
      emitEvent("onNdefRead", ["payload": text, "source": "ndef"])
      session.alertMessage = "Invite received. Confirm carefully in Litmo."
    } else {
      emitEvent("onError", [
        "message": "No Litmo NDEF text/URI found on this tag.",
        "code": "empty_tag",
      ])
    }
  }

  func readerSession(_ session: NFCNDEFReaderSession, didDetect tags: [NFCNDEFTag]) {
    guard let tag = tags.first else { return }
    session.connect(to: tag) { error in
      if let error {
        session.invalidate(errorMessage: error.localizedDescription)
        return
      }
      tag.queryNDEFStatus { status, capacity, error in
        if let error {
          session.invalidate(errorMessage: error.localizedDescription)
          return
        }
        switch self.mode {
        case .writing:
          self.performWrite(session: session, tag: tag, status: status, capacity: capacity)
        case .reading:
          self.performRead(session: session, tag: tag)
        case .idle:
          session.invalidate()
        }
      }
    }
  }

  private func performRead(session: NFCNDEFReaderSession, tag: NFCNDEFTag) {
    tag.readNDEF { message, error in
      if let error {
        session.invalidate(errorMessage: error.localizedDescription)
        return
      }
      guard let message, let text = self.firstText(from: [message]) else {
        session.invalidate(errorMessage: "No Litmo invite found on this tag.")
        return
      }
      self.emitEvent("onNdefRead", ["payload": text, "source": "tag"])
      session.alertMessage = "Invite received. Confirm carefully in Litmo."
      session.invalidate()
    }
  }

  private func performWrite(
    session: NFCNDEFReaderSession,
    tag: NFCNDEFTag,
    status: NFCNDEFStatus,
    capacity: Int
  ) {
    guard status == .readWrite else {
      session.invalidate(errorMessage: "This tag is not writable.")
      return
    }
    guard let payload = self.writePayload, let message = self.makeMessage(payload) else {
      session.invalidate(errorMessage: "Could not build NDEF message.")
      return
    }
    let length = message.length
    if length > capacity {
      session.invalidate(errorMessage: "Tag capacity is too small for this invite.")
      return
    }
    tag.writeNDEF(message) { error in
      if let error {
        session.invalidate(errorMessage: error.localizedDescription)
        return
      }
      self.emitEvent("onNdefWrite", ["ok": true])
      session.alertMessage = "Invite written. The other person can scan when ready."
      session.invalidate()
    }
  }

  private func makeMessage(_ payload: String) -> NFCNDEFMessage? {
    // URI record when possible; otherwise UTF-8 text.
    if payload.lowercased().hasPrefix("litmo://") || payload.lowercased().hasPrefix("https://") {
      if let record = NFCNDEFPayload.wellKnownTypeURIPayload(string: payload) {
        return NFCNDEFMessage(records: [record])
      }
    }
    guard let record = NFCNDEFPayload.wellKnownTypeTextPayload(string: payload, locale: Locale(identifier: "en")) else {
      return nil
    }
    return NFCNDEFMessage(records: [record])
  }

  private func firstText(from messages: [NFCNDEFMessage]) -> String? {
    for message in messages {
      for record in message.records {
        if let uri = record.wellKnownTypeURIPayload()?.absoluteString, !uri.isEmpty {
          return uri
        }
        if let text = parseWellKnownText(record), !text.isEmpty {
          return text
        }
        // Raw UTF-8 fallback for custom/absolute URI payloads.
        if let s = String(data: record.payload, encoding: .utf8) {
          let trimmed = s.trimmingCharacters(in: .controlCharacters)
          if trimmed.contains("litmo://") || trimmed.contains("https://") {
            return trimmed
          }
        }
      }
    }
    return nil
  }

  /// Parse NFC Forum Well Known Type Text (TNF 0x01, type "T").
  /// Avoids SDK-specific instance helpers that break on Xcode beta CoreNFC.
  private func parseWellKnownText(_ record: NFCNDEFPayload) -> String? {
    let typeString = String(data: record.type, encoding: .utf8) ?? ""
    guard typeString == "T" else { return nil }
    let data = record.payload
    guard !data.isEmpty else { return nil }
    let status = data[data.startIndex]
    let langLen = Int(status & 0x3F)
    let isUTF16 = (status & 0x80) != 0
    let textStart = 1 + langLen
    guard data.count >= textStart else { return nil }
    let textData = data.subdata(in: textStart..<data.count)
    if isUTF16 {
      return String(data: textData, encoding: .utf16)
    }
    return String(data: textData, encoding: .utf8)
  }
}
