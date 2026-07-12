import ExpoModulesCore
import UIKit

#if canImport(DeclaredAgeRange)
import DeclaredAgeRange
#endif

/**
 * Bridge for Apple Declared Age Range (privacy-preserving adult eligibility).
 * On OS/SDK builds without DeclaredAgeRange, returns status "unavailable"
 * so JS can fail closed (or development self-attest). Never collects DOB or ID images.
 */
public final class LitmoAgeRangeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LitmoAgeRange")

    AsyncFunction("isAvailableAsync") { () -> Bool in
      #if canImport(DeclaredAgeRange)
      if #available(iOS 26.0, *) { return true }
      #endif
      return false
    }

    AsyncFunction("requestAdultRangeAsync") { (promise: Promise) in
      #if canImport(DeclaredAgeRange)
      if #available(iOS 26.0, *) {
        Task { @MainActor in
          await Self.performAdultRequest(promise: promise)
        }
        return
      }
      #endif
      promise.resolve(Self.unavailablePayload(
        message: "Declared Age Range requires iOS 26+ and a development build with the Declared Age Range capability."
      ))
    }
  }

  private static func unavailablePayload(message: String) -> [String: Any] {
    [
      "status": "unavailable",
      "source": "apple_declared_age_range",
      "message": message,
    ]
  }

  #if canImport(DeclaredAgeRange)
  @available(iOS 26.0, *)
  @MainActor
  private static func performAdultRequest(promise: Promise) async {
    guard let presenter = topViewController() else {
      promise.resolve(unavailablePayload(
        message: "No view controller is available to present the age range request."
      ))
      return
    }

    do {
      // Gate at 18 so ranges distinguish under-18 vs adult.
      let response = try await AgeRangeService.shared.requestAgeRange(
        ageGates: 18,
        in: presenter
      )
      switch response {
      case .declinedSharing:
        promise.resolve([
          "status": "declined",
          "source": "apple_declared_age_range",
          "message": "Age range was not shared. Litmo is for adults 18+.",
        ] as [String: Any])
      case .sharing(let range):
        let lower = range.lowerBound
        let upper = range.upperBound
        let adult: Bool
        if let lower {
          adult = lower >= 18
        } else {
          // Missing lower bound typically means under the first gate.
          adult = false
        }
        var payload: [String: Any] = [
          "status": adult ? "adult" : "not_adult",
          "source": "apple_declared_age_range",
        ]
        if let lower { payload["lowerBound"] = lower }
        if let upper { payload["upperBound"] = upper }
        if !adult {
          payload["message"] = "Litmo is for adults 18+."
        }
        promise.resolve(payload)
      @unknown default:
        promise.resolve(unavailablePayload(
          message: "An unexpected age-range response was returned."
        ))
      }
    } catch {
      promise.resolve(unavailablePayload(
        message: "Age range could not be requested on this device."
      ))
    }
  }
  #endif

  @MainActor
  private static func topViewController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let window = scenes
      .flatMap(\.windows)
      .first(where: \.isKeyWindow) ?? scenes.first?.windows.first
    var controller = window?.rootViewController
    while let presented = controller?.presentedViewController {
      controller = presented
    }
    return controller
  }
}
