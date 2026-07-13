import Foundation

/// Dual product modes — parity with TypeScript `LitmoBuildMode`.
///
/// - `maximum` / MAXIMUM_MODE: full autistic consent experience (macOS, Linux, internal).
/// - `appStore` / APP_STORE_SAFE: review-sanitized presentation (iOS store binaries).
///
/// WHAT: Closed enum + compile-time active mode resolution.
/// WHY: Native macOS must not invent a third consent philosophy.
/// CONSENT: Mode never disables Soft Signal stop or dual-seal law in FeatureFlags.
/// SEE: docs/DUAL_MODE_ARCHITECTURE.md
public enum LitmoBuildMode: String, Sendable, CaseIterable, Codable {
    case maximum = "maximum"
    case appStore = "app_store"

    public var label: String {
        switch self {
        case .maximum:
            return "MAXIMUM_MODE — full unhinged consent system"
        case .appStore:
            return "APP_STORE_SAFE — review-sanitized iOS binary"
        }
    }
}

/// Active mode for this binary, resolved from compilation conditions.
///
/// Priority:
/// 1. `#if APP_STORE_SAFE` → `.appStore`
/// 2. `#if MAXIMUM_MODE` → `.maximum`
/// 3. Fallback: macOS → maximum, iOS → appStore (platform law)
public enum LitmoBuildModeRuntime {
    /// WHAT: Frozen mode for this native binary.
    /// WHY: Views branch on `.active` without scattering #if in every file.
    public static var active: LitmoBuildMode {
        #if APP_STORE_SAFE && !MAXIMUM_MODE
        return .appStore
        #elseif MAXIMUM_MODE && !APP_STORE_SAFE
        return .maximum
        #elseif APP_STORE_SAFE
        // Both defined: prefer App Store Safe (fail toward Review safety).
        return .appStore
        #elseif MAXIMUM_MODE
        return .maximum
        #else
        // No defines: platform law.
        #if os(iOS) || os(tvOS) || os(watchOS)
        return .appStore
        #else
        return .maximum
        #endif
        #endif
    }

    /// Compile-time style aliases (match TypeScript MAXIMUM_MODE / APP_STORE_SAFE).
    public static var isMaximumMode: Bool { active == .maximum }
    public static var isAppStoreSafe: Bool { active == .appStore }
}
