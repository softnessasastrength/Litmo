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

public typealias TrustHistoryLoadState = ParticipantReadOutcome<MyTrustSignals>

/// Pure decoding of the server RPC payload. Never invents success data.
public enum TrustSignalsDecoder {
    public static func decode(_ data: Data) throws -> MyTrustSignals {
        let row: [String: Any]
        do {
            row = try JSONFieldDecoding.firstObject(in: data)
        } catch {
            throw ParticipantReadFailure.decoding("Trust signals were unavailable.")
        }

        guard
            let accountAge = JSONFieldDecoding.intValue(row["account_age_days"]),
            let profileComplete = JSONFieldDecoding.boolValue(row["profile_complete"]),
            let adultEligible = JSONFieldDecoding.boolValue(row["adult_eligible"]),
            let completed = JSONFieldDecoding.intValue(row["completed_sessions"]),
            let softSignaled = JSONFieldDecoding.intValue(row["soft_signaled_sessions"]),
            let safetyEnded = JSONFieldDecoding.intValue(row["safety_ended_sessions"])
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
}
