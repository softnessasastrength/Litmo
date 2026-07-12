import AuthenticationServices
import ExpoModulesCore
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
