import XCTest
@testable import LitmoMacCore

final class SessionRequestsTests: XCTestCase {
    func testDecoderAcceptsIncomingRows() throws {
        let json = """
        [{
          "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          "requester_id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          "created_at": "2026-07-13T12:00:00Z",
          "expires_at": "2026-07-14T12:00:00Z"
        }]
        """.data(using: .utf8)!
        let rows = try SessionRequestListDecoder.decodeIncoming(json)
        XCTAssertEqual(rows.count, 1)
        XCTAssertEqual(rows[0].direction, .incoming)
        XCTAssertEqual(rows[0].counterpartUserId, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
    }

    func testDecoderAcceptsEmptyArray() throws {
        let rows = try SessionRequestListDecoder.decodeOutgoing(Data("[]".utf8))
        XCTAssertEqual(rows, [])
    }

    func testDecoderFailsClosedOnMissingFields() {
        let json = Data(#"[{"id":"x"}]"#.utf8)
        XCTAssertThrowsError(try SessionRequestListDecoder.decodeIncoming(json))
    }

    func testClientFailsClosedWithoutSession() async {
        let client = SupabaseSessionRequestsClient(
            configuration: .success(
                ParticipantServerConfiguration(
                    supabaseURL: URL(string: "https://example.supabase.co")!,
                    anonKey: "anon"
                )
            ),
            credentials: .failure(.unauthenticated("no session")),
            http: FixedHTTPPerformer(result: .failure(URLError(.notConnectedToInternet)))
        )
        let state = await client.fetchSessionRequests()
        XCTAssertEqual(state, .unauthenticated("no session"))
    }

    func testClientLoadsBothLists() async {
        let body = Data("[]".utf8)
        let response = HTTPURLResponse(
            url: URL(string: "https://example.supabase.co/rest/v1/rpc/list_incoming_requests")!,
            statusCode: 200,
            httpVersion: nil,
            headerFields: nil
        )!
        let client = SupabaseSessionRequestsClient(
            configuration: .success(
                ParticipantServerConfiguration(
                    supabaseURL: URL(string: "https://example.supabase.co")!,
                    anonKey: "anon"
                )
            ),
            credentials: .success(ParticipantSessionCredentials(accessToken: "token")),
            http: FixedHTTPPerformer(result: .success((body, response)))
        )
        let state = await client.fetchSessionRequests()
        guard case .loaded(let lists) = state else {
            return XCTFail("expected loaded, got \(state)")
        }
        XCTAssertTrue(lists.isEmpty)
    }

    func testClientFailsClosedOnHTTPError() async {
        let response = HTTPURLResponse(
            url: URL(string: "https://example.supabase.co/rest/v1/rpc/list_incoming_requests")!,
            statusCode: 403,
            httpVersion: nil,
            headerFields: nil
        )!
        let client = SupabaseSessionRequestsClient(
            configuration: .success(
                ParticipantServerConfiguration(
                    supabaseURL: URL(string: "https://example.supabase.co")!,
                    anonKey: "anon"
                )
            ),
            credentials: .success(ParticipantSessionCredentials(accessToken: "token")),
            http: FixedHTTPPerformer(result: .success((Data(), response)))
        )
        let state = await client.fetchSessionRequests()
        guard case .unavailable(let message) = state else {
            return XCTFail("expected unavailable, got \(state)")
        }
        XCTAssertTrue(message.contains("403"))
        XCTAssertTrue(state.isFailClosed)
    }
}
