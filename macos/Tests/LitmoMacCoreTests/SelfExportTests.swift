import XCTest
@testable import LitmoMacCore

final class SelfExportTests: XCTestCase {
    func testDecoderAcceptsCanonicalExportShape() throws {
        let json = """
        {
          "generated_at": "2026-07-13T12:00:00Z",
          "profile": {"user_id": "u1", "display_name": "Maya"},
          "touch_profile_versions": [{}, {}],
          "consent_preference_versions": [],
          "sessions": [{}],
          "reports_submitted": [],
          "trust_events": [{}, {}, {}]
        }
        """.data(using: .utf8)!

        let summary = try SelfExportDecoder.decode(json)
        XCTAssertEqual(summary.generatedAt, "2026-07-13T12:00:00Z")
        XCTAssertEqual(summary.categories.count, 6)
        XCTAssertEqual(summary.categories.first { $0.key == "touch_profile_versions" }?.itemCount, 2)
        XCTAssertEqual(summary.categories.first { $0.key == "trust_events" }?.itemCount, 3)
        XCTAssertTrue(summary.prettyJSON.contains("display_name"))
    }

    func testDecoderFailsClosedOnNonObject() {
        XCTAssertThrowsError(try SelfExportDecoder.decode(Data("[]".utf8)))
    }

    func testClientFailsClosedWithoutConfiguration() async {
        let client = SupabaseSelfExportClient(
            configuration: .failure(.missingConfiguration("no config")),
            credentials: .success(ParticipantSessionCredentials(accessToken: "t")),
            http: FixedHTTPPerformer(result: .failure(URLError(.notConnectedToInternet)))
        )
        let state = await client.fetchSelfExport()
        XCTAssertEqual(state, .missingConfiguration("no config"))
    }

    func testClientLoadsExportFromHTTP() async {
        let body = """
        {
          "generated_at": "2026-07-13T12:00:00Z",
          "profile": {"user_id": "u1"},
          "touch_profile_versions": [],
          "consent_preference_versions": [],
          "sessions": [],
          "reports_submitted": [],
          "trust_events": []
        }
        """.data(using: .utf8)!
        let response = HTTPURLResponse(
            url: URL(string: "https://example.supabase.co/rest/v1/rpc/export_my_data")!,
            statusCode: 200,
            httpVersion: nil,
            headerFields: nil
        )!
        let client = SupabaseSelfExportClient(
            configuration: .success(
                ParticipantServerConfiguration(
                    supabaseURL: URL(string: "https://example.supabase.co")!,
                    anonKey: "anon"
                )
            ),
            credentials: .success(ParticipantSessionCredentials(accessToken: "token")),
            http: FixedHTTPPerformer(result: .success((body, response)))
        )
        let state = await client.fetchSelfExport()
        guard case .loaded(let summary) = state else {
            return XCTFail("expected loaded, got \(state)")
        }
        XCTAssertEqual(summary.categories.first { $0.key == "profile" }?.present, true)
    }

    func testClientFailsClosedOnHTTPError() async {
        let response = HTTPURLResponse(
            url: URL(string: "https://example.supabase.co/rest/v1/rpc/export_my_data")!,
            statusCode: 401,
            httpVersion: nil,
            headerFields: nil
        )!
        let client = SupabaseSelfExportClient(
            configuration: .success(
                ParticipantServerConfiguration(
                    supabaseURL: URL(string: "https://example.supabase.co")!,
                    anonKey: "anon"
                )
            ),
            credentials: .success(ParticipantSessionCredentials(accessToken: "token")),
            http: FixedHTTPPerformer(result: .success((Data(), response)))
        )
        let state = await client.fetchSelfExport()
        guard case .unavailable(let message) = state else {
            return XCTFail("expected unavailable, got \(state)")
        }
        XCTAssertTrue(message.contains("401"))
        XCTAssertTrue(state.isFailClosed)
    }
}
