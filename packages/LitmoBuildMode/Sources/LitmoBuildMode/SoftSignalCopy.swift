import Foundation

/// Soft Signal / end-session copy — parity with `app/config/copy/*`.
///
/// WHAT: Mode-selected strings for native Soft Signal chrome.
/// WHY: macOS Maximum keeps sacred stop language; iOS Safe uses calm end-session.
/// CONSENT: Both packs: no reason required; not emergency services; not a penalty.
public struct SoftSignalCopyPack: Sendable, Equatable {
    public let button: String
    public let buttonStopping: String
    public let buttonStopped: String
    public let hint: String
    public let bannerTitle: String
    public let bannerBody: String
    public let notEmergency: String
    public let stickyLabel: String

    /// MAXIMUM_MODE — sacred unilateral stop.
    public static let maximum = SoftSignalCopyPack(
        button: "Soft Signal — end now",
        buttonStopping: "Stopping…",
        buttonStopped: "You are free",
        hint: "Ends everything immediately. No explanation. No penalty. A complete sentence of care. Not emergency or crisis services.",
        bannerTitle: "Soft Signal",
        bannerBody: "Your stop is sacred here. Soft Signal is success — a safe exit — never failure, never blame, never a debate.",
        notEmergency: "Litmo is not emergency response or crisis services. If you are in danger, use local emergency services.",
        stickyLabel: "ALWAYS AVAILABLE · NO REASON NEEDED · NEVER A PENALTY"
    )

    /// APP_STORE_SAFE — calmer labels, same authority.
    public static let appStore = SoftSignalCopyPack(
        button: "End session now",
        buttonStopping: "Ending…",
        buttonStopped: "Session ended",
        hint: "Ends the session immediately. No explanation required. Not a penalty. Litmo is not emergency or crisis services.",
        bannerTitle: "End session",
        bannerBody: "You can end at any time. Ending is always allowed, never a failure, and never requires the other person’s permission.",
        notEmergency: "Litmo is not emergency response or crisis services. If you are in danger, contact local emergency services.",
        stickyLabel: "ALWAYS AVAILABLE · NO REASON NEEDED"
    )

    public static var current: SoftSignalCopyPack {
        LitmoBuildModeRuntime.isAppStoreSafe ? .appStore : .maximum
    }
}
