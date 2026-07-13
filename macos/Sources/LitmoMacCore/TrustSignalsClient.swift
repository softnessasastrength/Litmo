import Foundation

/// Minimal HTTP surface so tests can inject responses without a live network.
public protocol HTTPPerforming: Sendable {
    func data(for request: URLRequest) async throws -> (Data, URLResponse)
}

public struct URLSessionHTTPPerformer: HTTPPerforming {
    public init() {}

    public func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        try await URLSession.shared.data(for: request)
    }
}

/// Read-only access to self trust signals. Does not mutate account state.
public protocol TrustSignalsClient: Sendable {
    func fetchMyTrustSignals() async -> TrustHistoryLoadState
}

/// Resolves configuration and credentials, then calls the server RPC.
public struct SupabaseTrustSignalsClient: TrustSignalsClient {
    private let configuration: Result<ParticipantServerConfiguration, ParticipantReadFailure>
    private let credentials: Result<ParticipantSessionCredentials, ParticipantReadFailure>
    private let http: any HTTPPerforming

    public init(
        configuration: Result<ParticipantServerConfiguration, ParticipantReadFailure>,
        credentials: Result<ParticipantSessionCredentials, ParticipantReadFailure>,
        http: any HTTPPerforming = URLSessionHTTPPerformer()
    ) {
        self.configuration = configuration
        self.credentials = credentials
        self.http = http
    }

    public static func fromEnvironment(
        _ environment: [String: String] = ProcessInfo.processInfo.environment,
        http: any HTTPPerforming = URLSessionHTTPPerformer()
    ) -> SupabaseTrustSignalsClient {
        SupabaseTrustSignalsClient(
            configuration: ParticipantServerConfiguration.fromEnvironment(environment),
            credentials: ParticipantSessionCredentials.fromEnvironment(environment),
            http: http
        )
    }

    public func fetchMyTrustSignals() async -> TrustHistoryLoadState {
        let config: ParticipantServerConfiguration
        switch configuration {
        case .failure(let failure):
            return .missingConfiguration(failure.userMessage)
        case .success(let value):
            config = value
        }

        let session: ParticipantSessionCredentials
        switch credentials {
        case .failure(let failure):
            return .unauthenticated(failure.userMessage)
        case .success(let value):
            session = value
        }

        let endpoint = config.supabaseURL
            .appendingPathComponent("rest")
            .appendingPathComponent("v1")
            .appendingPathComponent("rpc")
            .appendingPathComponent("my_trust_signals")

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(config.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("return=representation", forHTTPHeaderField: "Prefer")
        request.httpBody = Data("{}".utf8)
        request.timeoutInterval = 15

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await http.data(for: request)
        } catch {
            return .unavailable("The server could not be reached. Trust history stays closed.")
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            return .unavailable("The server response was not recognized. Trust history stays closed.")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            return .unavailable(
                "The server refused trust history (HTTP \(httpResponse.statusCode)). No substitute data is shown."
            )
        }

        do {
            let signals = try TrustSignalsDecoder.decode(data)
            return .loaded(signals)
        } catch let failure as ParticipantReadFailure {
            return .unavailable(failure.userMessage)
        } catch {
            return .unavailable("Trust signals could not be decoded. No substitute data is shown.")
        }
    }
}

/// Always-closed client used when the surface must not attempt network I/O.
public struct UnavailableTrustSignalsClient: TrustSignalsClient {
    private let message: String

    public init(message: String = "Trust history is not available in this build.") {
        self.message = message
    }

    public func fetchMyTrustSignals() async -> TrustHistoryLoadState {
        .unavailable(message)
    }
}
