import Foundation

/// Self-only trust facts returned by `public.my_trust_signals()`.
///
/// These are presentation of server fields, not a computed safety score.
/// Positive history never grants consent (ADR 0029 / ADR 0045).
public struct MyTrustSignals: Equatable, Sendable {
    public let accountAgeDays: Int
    public let profileComplete: Bool
    public let adultEligible: Bool
    public let completedSessions: Int
    public let softSignaledSessions: Int
    public let safetyEndedSessions: Int

    public init(
        accountAgeDays: Int,
        profileComplete: Bool,
        adultEligible: Bool,
        completedSessions: Int,
        softSignaledSessions: Int,
        safetyEndedSessions: Int
    ) {
        self.accountAgeDays = accountAgeDays
        self.profileComplete = profileComplete
        self.adultEligible = adultEligible
        self.completedSessions = completedSessions
        self.softSignaledSessions = softSignaledSessions
        self.safetyEndedSessions = safetyEndedSessions
    }
}

/// Load states for the macOS trust-history surface.
public enum TrustHistoryLoadState: Equatable, Sendable {
    case idle
    case loading
    case missingConfiguration(String)
    case unauthenticated(String)
    case unavailable(String)
    case loaded(MyTrustSignals)

    public var isFailClosed: Bool {
        switch self {
        case .loaded, .loading, .idle:
            return false
        case .missingConfiguration, .unauthenticated, .unavailable:
            return true
        }
    }
}

/// Pure decoding of the server RPC payload. Never invents success data.
public enum TrustSignalsDecoder {
    public static func decode(_ data: Data) throws -> MyTrustSignals {
        let object: Any
        do {
            object = try JSONSerialization.jsonObject(with: data, options: [])
        } catch {
            throw ParticipantReadFailure.decoding("Trust signals response was not valid JSON.")
        }

        let row: [String: Any]
        if let array = object as? [Any] {
            guard let first = array.first as? [String: Any] else {
                throw ParticipantReadFailure.decoding("Trust signals were unavailable.")
            }
            row = first
        } else if let dict = object as? [String: Any] {
            row = dict
        } else {
            throw ParticipantReadFailure.decoding("Trust signals were unavailable.")
        }

        guard
            let accountAge = intValue(row["account_age_days"]),
            let profileComplete = boolValue(row["profile_complete"]),
            let adultEligible = boolValue(row["adult_eligible"]),
            let completed = intValue(row["completed_sessions"]),
            let softSignaled = intValue(row["soft_signaled_sessions"]),
            let safetyEnded = intValue(row["safety_ended_sessions"])
        else {
            throw ParticipantReadFailure.decoding(
                "Trust signals response was incomplete. No substitute values were invented."
            )
        }

        return MyTrustSignals(
            accountAgeDays: accountAge,
            profileComplete: profileComplete,
            adultEligible: adultEligible,
            completedSessions: completed,
            softSignaledSessions: softSignaled,
            safetyEndedSessions: safetyEnded
        )
    }

    private static func intValue(_ raw: Any?) -> Int? {
        switch raw {
        case let value as Int:
            return value
        case let value as NSNumber:
            return value.intValue
        case let value as String:
            return Int(value)
        default:
            return nil
        }
    }

    private static func boolValue(_ raw: Any?) -> Bool? {
        switch raw {
        case let value as Bool:
            return value
        case let value as NSNumber:
            return value.boolValue
        default:
            return nil
        }
    }
}
