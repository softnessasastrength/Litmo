import Foundation

/// Read-only access to the authenticated participant's own profile row.
public protocol OwnProfileClient: Sendable {
    func fetchOwnProfile() async -> OwnProfileLoadState
}

public struct SupabaseOwnProfileClient: OwnProfileClient {
    private let transport: SupabaseParticipantTransport

    public init(transport: SupabaseParticipantTransport) {
        self.transport = transport
    }

    public init(
        configuration: Result<ParticipantServerConfiguration, ParticipantReadFailure>,
        credentials: Result<ParticipantSessionCredentials, ParticipantReadFailure>,
        http: any HTTPPerforming = URLSessionHTTPPerformer()
    ) {
        self.transport = SupabaseParticipantTransport(
            configuration: configuration,
            credentials: credentials,
            http: http,
            surfaceName: "profile"
        )
    }

    public static func fromEnvironment(
        _ environment: [String: String] = ProcessInfo.processInfo.environment,
        http: any HTTPPerforming = URLSessionHTTPPerformer()
    ) -> SupabaseOwnProfileClient {
        SupabaseOwnProfileClient(
            transport: .fromEnvironment(environment, http: http, surfaceName: "profile")
        )
    }

    public func fetchOwnProfile() async -> OwnProfileLoadState {
        let request = transport.authenticatedRequest(
            pathComponents: ["rest", "v1", "profiles"],
            method: "GET",
            queryItems: [
                URLQueryItem(
                    name: "select",
                    value: "user_id,display_name,pronouns,bio,vibe_archetype,onboarding_completed_at"
                )
            ]
        )

        switch await transport.send(request) {
        case .failure(let failure):
            return .from(failure: failure)
        case .success(let data):
            do {
                return .loaded(try OwnProfileDecoder.decode(data))
            } catch let failure as ParticipantReadFailure {
                return .from(failure: failure)
            } catch {
                return .unavailable("Profile could not be decoded. No substitute data is shown.")
            }
        }
    }
}

public struct UnavailableOwnProfileClient: OwnProfileClient {
    private let message: String

    public init(message: String = "Profile is not available in this build.") {
        self.message = message
    }

    public func fetchOwnProfile() async -> OwnProfileLoadState {
        .unavailable(message)
    }
}
