import Foundation

/// Failures that keep macOS participant reads closed.
public enum ParticipantReadFailure: Error, Equatable, Sendable {
    case missingConfiguration(String)
    case unauthenticated(String)
    case transport(String)
    case decoding(String)
    case server(String)

    public var userMessage: String {
        switch self {
        case .missingConfiguration(let detail):
            return detail
        case .unauthenticated(let detail):
            return detail
        case .transport(let detail):
            return detail
        case .decoding(let detail):
            return detail
        case .server(let detail):
            return detail
        }
    }
}

/// Server endpoints required for read-only participant RPCs.
///
/// Credentials are never invented. Without an explicit Supabase URL and anon
/// key the macOS client stays unavailable.
public struct ParticipantServerConfiguration: Equatable, Sendable {
    public let supabaseURL: URL
    public let anonKey: String

    public init(supabaseURL: URL, anonKey: String) {
        self.supabaseURL = supabaseURL
        self.anonKey = anonKey
    }

    /// Resolve configuration from environment variables.
    ///
    /// Expected keys:
    /// - `LITMO_SUPABASE_URL`
    /// - `LITMO_SUPABASE_ANON_KEY`
    public static func fromEnvironment(
        _ environment: [String: String] = ProcessInfo.processInfo.environment
    ) -> Result<ParticipantServerConfiguration, ParticipantReadFailure> {
        let rawURL = environment["LITMO_SUPABASE_URL"]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let anonKey = environment["LITMO_SUPABASE_ANON_KEY"]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        guard !rawURL.isEmpty, let url = URL(string: rawURL), let scheme = url.scheme?.lowercased(),
              scheme == "https" || scheme == "http"
        else {
            return .failure(
                .missingConfiguration(
                    "Server configuration is unavailable. Set LITMO_SUPABASE_URL to a valid http(s) base URL."
                )
            )
        }
        guard !anonKey.isEmpty else {
            return .failure(
                .missingConfiguration(
                    "Server configuration is unavailable. Set LITMO_SUPABASE_ANON_KEY."
                )
            )
        }
        return .success(ParticipantServerConfiguration(supabaseURL: url, anonKey: anonKey))
    }
}

/// Short-lived access token for authenticated participant reads.
///
/// This first macOS slice does not implement passkey sign-in. A developer may
/// supply `LITMO_ACCESS_TOKEN` for local inspection only. Tokens are never
/// fabricated, cached across apps, or shared with Litmo Ops.
public struct ParticipantSessionCredentials: Equatable, Sendable {
    public let accessToken: String

    public init(accessToken: String) {
        self.accessToken = accessToken
    }

    public static func fromEnvironment(
        _ environment: [String: String] = ProcessInfo.processInfo.environment
    ) -> Result<ParticipantSessionCredentials, ParticipantReadFailure> {
        let token = environment["LITMO_ACCESS_TOKEN"]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !token.isEmpty else {
            return .failure(
                .unauthenticated(
                    "No participant session is connected. Set LITMO_ACCESS_TOKEN for local inspection, or use the phone app for account sessions."
                )
            )
        }
        return .success(ParticipantSessionCredentials(accessToken: token))
    }
}
