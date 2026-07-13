import Foundation

/// Read-only self export via `export_my_data`. No deletion or staff access.
public protocol SelfExportClient: Sendable {
    func fetchSelfExport() async -> SelfExportLoadState
}

public struct SupabaseSelfExportClient: SelfExportClient {
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
            surfaceName: "self export"
        )
    }

    public static func fromEnvironment(
        _ environment: [String: String] = ProcessInfo.processInfo.environment,
        http: any HTTPPerforming = URLSessionHTTPPerformer()
    ) -> SupabaseSelfExportClient {
        SupabaseSelfExportClient(
            transport: .fromEnvironment(environment, http: http, surfaceName: "self export")
        )
    }

    public func fetchSelfExport() async -> SelfExportLoadState {
        let request = transport.authenticatedRequest(
            pathComponents: ["rest", "v1", "rpc", "export_my_data"],
            method: "POST",
            body: Data("{}".utf8)
        )

        switch await transport.send(request) {
        case .failure(let failure):
            return .from(failure: failure)
        case .success(let data):
            do {
                return .loaded(try SelfExportDecoder.decode(data))
            } catch let failure as ParticipantReadFailure {
                return .from(failure: failure)
            } catch {
                return .unavailable("Export could not be decoded. No substitute data is shown.")
            }
        }
    }
}

public struct UnavailableSelfExportClient: SelfExportClient {
    private let message: String

    public init(message: String = "Self export is not available in this build.") {
        self.message = message
    }

    public func fetchSelfExport() async -> SelfExportLoadState {
        .unavailable(message)
    }
}
