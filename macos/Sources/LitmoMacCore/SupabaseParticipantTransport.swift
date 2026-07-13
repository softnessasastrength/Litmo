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

/// Shared authenticated transport for participant read-only Supabase calls.
public struct SupabaseParticipantTransport: Sendable {
    public let configuration: Result<ParticipantServerConfiguration, ParticipantReadFailure>
    public let credentials: Result<ParticipantSessionCredentials, ParticipantReadFailure>
    public let http: any HTTPPerforming
    public let surfaceName: String

    public init(
        configuration: Result<ParticipantServerConfiguration, ParticipantReadFailure>,
        credentials: Result<ParticipantSessionCredentials, ParticipantReadFailure>,
        http: any HTTPPerforming = URLSessionHTTPPerformer(),
        surfaceName: String
    ) {
        self.configuration = configuration
        self.credentials = credentials
        self.http = http
        self.surfaceName = surfaceName
    }

    public static func fromEnvironment(
        _ environment: [String: String] = ProcessInfo.processInfo.environment,
        http: any HTTPPerforming = URLSessionHTTPPerformer(),
        surfaceName: String
    ) -> SupabaseParticipantTransport {
        SupabaseParticipantTransport(
            configuration: ParticipantServerConfiguration.fromEnvironment(environment),
            credentials: ParticipantSessionCredentials.fromEnvironment(environment),
            http: http,
            surfaceName: surfaceName
        )
    }

    public func resolveSession() -> Result<
        (ParticipantServerConfiguration, ParticipantSessionCredentials),
        ParticipantReadFailure
    > {
        switch configuration {
        case .failure(let failure):
            return .failure(failure)
        case .success(let config):
            switch credentials {
            case .failure(let failure):
                return .failure(failure)
            case .success(let session):
                return .success((config, session))
            }
        }
    }

    public func authenticatedRequest(
        pathComponents: [String],
        method: String,
        queryItems: [URLQueryItem] = [],
        body: Data? = nil
    ) -> Result<URLRequest, ParticipantReadFailure> {
        switch resolveSession() {
        case .failure(let failure):
            return .failure(failure)
        case .success(let pair):
            let (config, session) = pair
            var url = config.supabaseURL
            for component in pathComponents {
                url = url.appendingPathComponent(component)
            }
            if !queryItems.isEmpty {
                guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
                    return .failure(.server("Could not build \(surfaceName) request URL."))
                }
                components.queryItems = queryItems
                guard let withQuery = components.url else {
                    return .failure(.server("Could not build \(surfaceName) query URL."))
                }
                url = withQuery
            }

            var request = URLRequest(url: url)
            request.httpMethod = method
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.setValue(config.anonKey, forHTTPHeaderField: "apikey")
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
            request.setValue("return=representation", forHTTPHeaderField: "Prefer")
            request.httpBody = body
            request.timeoutInterval = 15
            return .success(request)
        }
    }

    public func send(_ requestResult: Result<URLRequest, ParticipantReadFailure>) async -> Result<Data, ParticipantReadFailure> {
        let request: URLRequest
        switch requestResult {
        case .failure(let failure):
            return .failure(failure)
        case .success(let value):
            request = value
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await http.data(for: request)
        } catch {
            return .failure(
                .transport("The server could not be reached. \(surfaceName) stays closed.")
            )
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            return .failure(
                .server("The server response was not recognized. \(surfaceName) stays closed.")
            )
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            return .failure(
                .server(
                    "The server refused \(surfaceName) (HTTP \(httpResponse.statusCode)). No substitute data is shown."
                )
            )
        }

        return .success(data)
    }
}
