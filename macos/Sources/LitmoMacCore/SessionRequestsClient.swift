import Foundation

/// Read-only pending session request lists. No accept/decline/create.
public protocol SessionRequestsClient: Sendable {
    func fetchSessionRequests() async -> SessionRequestsLoadState
}

public struct SupabaseSessionRequestsClient: SessionRequestsClient {
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
            surfaceName: "session requests"
        )
    }

    public static func fromEnvironment(
        _ environment: [String: String] = ProcessInfo.processInfo.environment,
        http: any HTTPPerforming = URLSessionHTTPPerformer()
    ) -> SupabaseSessionRequestsClient {
        SupabaseSessionRequestsClient(
            transport: .fromEnvironment(environment, http: http, surfaceName: "session requests")
        )
    }

    public func fetchSessionRequests() async -> SessionRequestsLoadState {
        let incomingRequest = transport.authenticatedRequest(
            pathComponents: ["rest", "v1", "rpc", "list_incoming_requests"],
            method: "POST",
            body: Data("{}".utf8)
        )
        let outgoingRequest = transport.authenticatedRequest(
            pathComponents: ["rest", "v1", "rpc", "list_outgoing_requests"],
            method: "POST",
            body: Data("{}".utf8)
        )

        // Fail closed before any network if config/session is missing.
        if case .failure(let failure) = incomingRequest {
            return .from(failure: failure)
        }

        async let incomingResult = transport.send(incomingRequest)
        async let outgoingResult = transport.send(outgoingRequest)
        let (incomingData, outgoingData) = await (incomingResult, outgoingResult)

        switch (incomingData, outgoingData) {
        case (.failure(let failure), _):
            return .from(failure: failure)
        case (_, .failure(let failure)):
            return .from(failure: failure)
        case (.success(let inBody), .success(let outBody)):
            do {
                let lists = SessionRequestLists(
                    incoming: try SessionRequestListDecoder.decodeIncoming(inBody),
                    outgoing: try SessionRequestListDecoder.decodeOutgoing(outBody)
                )
                return .loaded(lists)
            } catch let failure as ParticipantReadFailure {
                return .from(failure: failure)
            } catch {
                return .unavailable("Session requests could not be decoded. No substitute data is shown.")
            }
        }
    }
}

public struct UnavailableSessionRequestsClient: SessionRequestsClient {
    private let message: String

    public init(message: String = "Session requests are not available in this build.") {
        self.message = message
    }

    public func fetchSessionRequests() async -> SessionRequestsLoadState {
        .unavailable(message)
    }
}
