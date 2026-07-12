import AuthenticationServices
import CryptoKit
import ExpoModulesCore
import LocalAuthentication
import Security
import UIKit

public final class LitmoPasskeysModule: Module {
  private let coordinator = PasskeyCoordinator()

  public func definition() -> ModuleDefinition {
    Name("LitmoPasskeys")

    AsyncFunction("registerAsync") { (options: [String: Any], promise: Promise) in
      guard !self.coordinator.isPending else {
        return promise.reject("ERR_PASSKEY_REQUEST_IN_PROGRESS", "A passkey request is already in progress.")
      }
      guard
        let rpId = options["relyingPartyId"] as? String,
        let challenge = decodeBase64URL(options["challenge"] as? String),
        let userId = decodeBase64URL(options["userId"] as? String),
        let userName = options["userName"] as? String,
        let displayName = options["userDisplayName"] as? String
      else { return promise.reject("ERR_PASSKEY_INVALID_REQUEST", "The passkey registration request was invalid.") }

      let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: rpId)
      let request = provider.createCredentialRegistrationRequest(challenge: challenge, name: userName, userID: userId)
      request.displayName = displayName
      request.userVerificationPreference = .required
      if #available(iOS 17.4, *), let ids = options["excludeCredentialIds"] as? [String] {
        request.excludedCredentials = ids.compactMap(decodeBase64URL).map {
          ASAuthorizationPlatformPublicKeyCredentialDescriptor(credentialID: $0)
        }
      }
      self.coordinator.perform(request: request, promise: promise)
    }

    AsyncFunction("authenticateAsync") { (options: [String: Any], promise: Promise) in
      guard !self.coordinator.isPending else {
        return promise.reject("ERR_PASSKEY_REQUEST_IN_PROGRESS", "A passkey request is already in progress.")
      }
      guard
        let rpId = options["relyingPartyId"] as? String,
        let challenge = decodeBase64URL(options["challenge"] as? String)
      else { return promise.reject("ERR_PASSKEY_INVALID_REQUEST", "The passkey authentication request was invalid.") }

      let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: rpId)
      let request = provider.createCredentialAssertionRequest(challenge: challenge)
      request.userVerificationPreference = .required
      if let ids = options["allowedCredentialIds"] as? [String], !ids.isEmpty {
        request.allowedCredentials = ids.compactMap(decodeBase64URL).map {
          ASAuthorizationPlatformPublicKeyCredentialDescriptor(credentialID: $0)
        }
      }
      self.coordinator.perform(request: request, promise: promise)
    }

    AsyncFunction("encryptSensitiveAsync") { (plaintext: String, purpose: String) throws -> [String: Any] in
      return try SensitiveVault.shared.encrypt(plaintext: plaintext, purpose: purpose)
    }

    AsyncFunction("decryptSensitiveAsync") { (envelope: [String: Any], purpose: String) throws -> String in
      return try SensitiveVault.shared.decrypt(envelope: envelope, purpose: purpose)
    }

    AsyncFunction("rotateSensitiveKeyAsync") { () throws -> Int in
      return try SensitiveVault.shared.rotate()
    }

    AsyncFunction("retireSensitiveKeyAsync") { (version: Int) throws in
      try SensitiveVault.shared.retire(version: version)
    }

    AsyncFunction("clearSensitiveKeysAsync") { () throws in
      try SensitiveVault.shared.clear()
    }
  }
}

private enum SensitiveVaultError: Error {
  case invalidEnvelope, unsupportedVersion, keyUnavailable, integrityFailure
}

private final class SensitiveVault {
  static let shared = SensitiveVault()
  private let service = "com.litmo.app.sensitive-vault"
  private let currentAccount = "current-key-version"
  private let formatVersion = 1

  func encrypt(plaintext: String, purpose: String) throws -> [String: Any] {
    let version = try currentVersion(create: true)
    let key = try loadKey(version: version, create: true)
    let aad = Data("litmo-sensitive-v1|\(purpose)|\(version)".utf8)
    let sealed = try AES.GCM.seal(Data(plaintext.utf8), using: key, authenticating: aad)
    guard let combined = sealed.combined else { throw SensitiveVaultError.integrityFailure }
    return ["format": formatVersion, "keyVersion": version, "ciphertext": encode(combined)]
  }

  func decrypt(envelope: [String: Any], purpose: String) throws -> String {
    guard let format = envelope["format"] as? Int, format == formatVersion,
          let version = envelope["keyVersion"] as? Int, version > 0,
          let encoded = envelope["ciphertext"] as? String,
          let combined = decodeBase64URL(encoded)
    else { throw SensitiveVaultError.invalidEnvelope }
    let key = try loadKey(version: version, create: false)
    let aad = Data("litmo-sensitive-v1|\(purpose)|\(version)".utf8)
    do {
      let box = try AES.GCM.SealedBox(combined: combined)
      let plaintext = try AES.GCM.open(box, using: key, authenticating: aad)
      guard let result = String(data: plaintext, encoding: .utf8) else { throw SensitiveVaultError.integrityFailure }
      return result
    } catch { throw SensitiveVaultError.integrityFailure }
  }

  func rotate() throws -> Int {
    let next = try currentVersion(create: true) + 1
    _ = try loadKey(version: next, create: true)
    try store(Data(String(next).utf8), account: currentAccount, requireOwner: false)
    return next
  }

  func retire(version: Int) throws { try delete(account: "key-v\(version)") }

  func clear() throws {
    let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service]
    let status = SecItemDelete(query as CFDictionary)
    guard status == errSecSuccess || status == errSecItemNotFound else { throw SensitiveVaultError.keyUnavailable }
  }

  private func currentVersion(create: Bool) throws -> Int {
    if let data = try read(account: currentAccount, prompt: false), let text = String(data: data, encoding: .utf8), let value = Int(text) { return value }
    guard create else { throw SensitiveVaultError.keyUnavailable }
    try store(Data("1".utf8), account: currentAccount, requireOwner: false)
    return 1
  }

  private func loadKey(version: Int, create: Bool) throws -> SymmetricKey {
    let account = "key-v\(version)"
    if let data = try read(account: account, prompt: true) { return SymmetricKey(data: data) }
    guard create else { throw SensitiveVaultError.keyUnavailable }
    let key = SymmetricKey(size: .bits256)
    let data = key.withUnsafeBytes { Data($0) }
    try store(data, account: account, requireOwner: true)
    return key
  }

  private func store(_ data: Data, account: String, requireOwner: Bool) throws {
    try? delete(account: account)
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: account,
      kSecValueData as String: data,
      kSecAttrAccessible as String: kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly
    ]
    if requireOwner {
      var error: Unmanaged<CFError>?
      guard let control = SecAccessControlCreateWithFlags(nil, kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly, [.biometryCurrentSet], &error) else { throw SensitiveVaultError.keyUnavailable }
      query.removeValue(forKey: kSecAttrAccessible as String)
      query[kSecAttrAccessControl as String] = control
    }
    guard SecItemAdd(query as CFDictionary, nil) == errSecSuccess else { throw SensitiveVaultError.keyUnavailable }
  }

  private func read(account: String, prompt: Bool) throws -> Data? {
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: account,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne
    ]
    if prompt { query[kSecUseOperationPrompt as String] = "Unlock Litmo's private data." }
    var result: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    if status == errSecItemNotFound { return nil }
    guard status == errSecSuccess, let data = result as? Data else { throw SensitiveVaultError.keyUnavailable }
    return data
  }

  private func delete(account: String) throws {
    let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: account]
    let status = SecItemDelete(query as CFDictionary)
    guard status == errSecSuccess || status == errSecItemNotFound else { throw SensitiveVaultError.keyUnavailable }
  }

  private func encode(_ data: Data) -> String {
    data.base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
  }
}

private final class PasskeyCoordinator: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
  private var pending: Promise?
  var isPending: Bool { pending != nil }

  func perform(request: ASAuthorizationRequest, promise: Promise) {
    pending = promise
    let controller = ASAuthorizationController(authorizationRequests: [request])
    controller.delegate = self
    controller.presentationContextProvider = self
    controller.performRequests()
  }

  public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
    guard let promise = pending else { return }
    pending = nil
    if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialRegistration,
       let attestation = credential.rawAttestationObject {
      promise.resolve(baseCredential(id: credential.credentialID, response: [
        "attestationObject": encode(attestation),
        "clientDataJSON": encode(credential.rawClientDataJSON),
        "transports": ["internal"]
      ]))
    } else if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion {
      promise.resolve(baseCredential(id: credential.credentialID, response: [
        "authenticatorData": encode(credential.rawAuthenticatorData),
        "clientDataJSON": encode(credential.rawClientDataJSON),
        "signature": encode(credential.signature),
        "userHandle": encode(credential.userID)
      ]))
    } else {
      promise.reject("ERR_PASSKEY_INVALID_RESPONSE", "Apple returned an incomplete passkey credential.")
    }
  }

  public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
    guard let promise = pending else { return }
    pending = nil
    let code = (error as? ASAuthorizationError)?.code
    switch code {
    case .canceled: promise.reject("ERR_PASSKEY_CANCELLED", "Passkey authentication was cancelled.")
    case .notHandled: promise.reject("ERR_PASSKEY_UNAVAILABLE", "Passkeys are unavailable on this device.")
    case .failed: promise.reject("ERR_PASSKEY_FAILED", "Apple could not verify this passkey.")
    default: promise.reject("ERR_PASSKEY_FAILED", "Passkey authentication did not complete.")
    }
  }

  public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    return scenes.flatMap(\.windows).first(where: { $0.isKeyWindow }) ?? ASPresentationAnchor()
  }

  private func baseCredential(id credentialID: Data, response: [String: Any]) -> [String: Any] {
    let id = encode(credentialID)
    return ["id": id, "rawId": id, "type": "public-key", "authenticatorAttachment": "platform", "clientExtensionResults": [:], "response": response]
  }

  private func encode(_ data: Data) -> String {
    data.base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
  }

}

private func decodeBase64URL(_ string: String?) -> Data? {
  guard var value = string else { return nil }
  value = value.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
  value += String(repeating: "=", count: (4 - value.count % 4) % 4)
  return Data(base64Encoded: value)
}
