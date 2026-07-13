import Foundation

/// Feature matrix — mirror of `app/config/features.ts`.
///
/// WHAT: Boolean policy for surfaces that differ by mode.
/// WHY: SwiftUI must not hardcode RF/NFC assumptions; macOS Maximum vs future iOS Safe.
/// CONSENT: Safety core properties are always `true` in both static tables.
public struct LitmoFeatureFlags: Sendable, Equatable {
    // Safety core — never false
    public let softSignalStop: Bool
    public let consentDualSeal: Bool
    public let ageGate: Bool
    public let profileIsNotConsent: Bool
    public let failClosedBoundaries: Bool

    // Experience
    public let consentMicrogrammarFull: Bool
    public let expandedBodyMap: Bool
    public let softLimitZoneStatus: Bool
    public let guidedLearningFull: Bool
    public let campfirePractice: Bool
    public let traumaSafetyToolkit: Bool
    public let softSignalPrivateLog: Bool
    public let softSignalPractice: Bool

    // Review-sensitive
    public let proximityRadar: Bool
    public let nfcCarefulConnect: Bool
    public let localMultipeerShare: Bool
    public let hardwareSoftSignal: Bool
    public let diagnosticsPanel: Bool
    public let demoModeSurface: Bool
    public let deepVibeOnboarding: Bool
    public let partnerQuizE2e: Bool
    public let safewordVocabularyUi: Bool
    public let aftercarePrepareUi: Bool
    public let softSignalSacredCopy: Bool
    public let softSignalReviewCopy: Bool
    public let showBuildModeBadge: Bool

    /// MAXIMUM_MODE table — every optional surface on.
    public static let maximum = LitmoFeatureFlags(
        softSignalStop: true,
        consentDualSeal: true,
        ageGate: true,
        profileIsNotConsent: true,
        failClosedBoundaries: true,
        consentMicrogrammarFull: true,
        expandedBodyMap: true,
        softLimitZoneStatus: true,
        guidedLearningFull: true,
        campfirePractice: true,
        traumaSafetyToolkit: true,
        softSignalPrivateLog: true,
        softSignalPractice: true,
        proximityRadar: true,
        nfcCarefulConnect: true,
        localMultipeerShare: true,
        hardwareSoftSignal: true,
        diagnosticsPanel: true,
        demoModeSurface: true,
        deepVibeOnboarding: true,
        partnerQuizE2e: true,
        safewordVocabularyUi: true,
        aftercarePrepareUi: true,
        softSignalSacredCopy: true,
        softSignalReviewCopy: false,
        showBuildModeBadge: true
    )

    /// APP_STORE_SAFE table — RF/NFC/hardware/demo off; safety core on.
    public static let appStore = LitmoFeatureFlags(
        softSignalStop: true,
        consentDualSeal: true,
        ageGate: true,
        profileIsNotConsent: true,
        failClosedBoundaries: true,
        consentMicrogrammarFull: true,
        expandedBodyMap: true,
        softLimitZoneStatus: true,
        guidedLearningFull: true,
        campfirePractice: true,
        traumaSafetyToolkit: true,
        softSignalPrivateLog: true,
        softSignalPractice: true,
        proximityRadar: false,
        nfcCarefulConnect: false,
        localMultipeerShare: false,
        hardwareSoftSignal: false,
        diagnosticsPanel: false,
        demoModeSurface: false,
        deepVibeOnboarding: true,
        partnerQuizE2e: true,
        safewordVocabularyUi: true,
        aftercarePrepareUi: true,
        softSignalSacredCopy: false,
        softSignalReviewCopy: true,
        showBuildModeBadge: false
    )

    /// Flags for the active compile-time mode.
    public static var current: LitmoFeatureFlags {
        LitmoBuildModeRuntime.isAppStoreSafe ? .appStore : .maximum
    }

    public static func forMode(_ mode: LitmoBuildMode) -> LitmoFeatureFlags {
        mode == .appStore ? .appStore : .maximum
    }
}
