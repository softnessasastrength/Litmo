import Foundation

/// Short native-facing notes on how consent flows differ by mode.
///
/// Full matrix lives in TypeScript `consentFlowsByMode.ts` and
/// `docs/DUAL_MODE_ARCHITECTURE.md`. This type keeps macOS UI honest about
/// what the shell may and may not claim.
public enum ConsentFlowNotes {
    /// WHAT: Copy for Campfire / participant shell about consent ownership.
    /// WHY: ADR 0045 — Swift does not recompute dual seal or Soft Signal session end.
    public static var domainAuthorityDisclaimer: String {
        if LitmoBuildModeRuntime.isMaximumMode {
            return "MAXIMUM_MODE: This Mac shell shows prepare and practice surfaces. Live dual-seal Soft Signal sessions remain authoritative in the TypeScript/server domain — never reimplemented here."
        }
        return "APP_STORE_SAFE: This client does not own physical session consent. Server and mobile domain remain authoritative."
    }

    /// Soft Signal presence in this shell.
    public static var softSignalShellBehavior: String {
        // Mac participant app does not run active physical sessions (ADR 0045).
        // Still document that FeatureFlags.softSignalStop is true for parity.
        "Soft Signal stop authority is product-true in both modes; this native shell does not fire live session Soft Signal — Campfire pause is local-only and reason-free."
    }

    /// Whether proximity-style RF would be allowed if implemented natively.
    public static var proximityAllowed: Bool {
        LitmoFeatureFlags.current.proximityRadar
    }
}
