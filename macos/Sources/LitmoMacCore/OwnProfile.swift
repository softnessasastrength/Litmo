import Foundation

/// Self-only profile projection from `public.profiles` under owner RLS.
///
/// Presentation of server fields only. A profile is never consent, eligibility
/// proof, or a safety rating (ADR 0045 / ADR 0047).
public struct OwnProfile: Equatable, Sendable {
    public let userId: String
    public let displayName: String
    public let pronouns: String?
    public let bio: String?
    public let vibeArchetype: String?
    public let onboardingCompletedAt: String?

    public init(
        userId: String,
        displayName: String,
        pronouns: String?,
        bio: String?,
        vibeArchetype: String?,
        onboardingCompletedAt: String?
    ) {
        self.userId = userId
        self.displayName = displayName
        self.pronouns = pronouns
        self.bio = bio
        self.vibeArchetype = vibeArchetype
        self.onboardingCompletedAt = onboardingCompletedAt
    }

    public var isOnboardingComplete: Bool {
        guard let onboardingCompletedAt, !onboardingCompletedAt.isEmpty else { return false }
        return true
    }
}

public typealias OwnProfileLoadState = ParticipantReadOutcome<OwnProfile>

/// Pure decoding of the profiles REST payload. Never invents a profile.
public enum OwnProfileDecoder {
    public static func decode(_ data: Data) throws -> OwnProfile {
        let rows = try JSONFieldDecoding.objects(in: data)
        guard let row = rows.first else {
            throw ParticipantReadFailure.decoding(
                "No profile row was returned. No substitute profile is shown."
            )
        }
        if rows.count > 1 {
            throw ParticipantReadFailure.decoding(
                "Multiple profile rows were returned unexpectedly. Profile stays closed."
            )
        }

        guard
            let userId = JSONFieldDecoding.stringValue(row["user_id"]),
            !userId.isEmpty,
            let displayName = JSONFieldDecoding.stringValue(row["display_name"]),
            !displayName.isEmpty
        else {
            throw ParticipantReadFailure.decoding(
                "Profile response was incomplete. No substitute values were invented."
            )
        }

        return OwnProfile(
            userId: userId,
            displayName: displayName,
            pronouns: JSONFieldDecoding.stringValue(row["pronouns"]),
            bio: JSONFieldDecoding.stringValue(row["bio"]),
            vibeArchetype: JSONFieldDecoding.stringValue(row["vibe_archetype"]),
            onboardingCompletedAt: JSONFieldDecoding.stringValue(row["onboarding_completed_at"])
        )
    }
}
