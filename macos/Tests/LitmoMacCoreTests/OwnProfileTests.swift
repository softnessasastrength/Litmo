import XCTest
@testable import LitmoMacCore

final class OwnProfileTests: XCTestCase {
    func testDecoderAcceptsSingleProfileRow() throws {
        let json = """
        [{
          "user_id": "11111111-1111-4111-8111-111111111111",
          "display_name": "Maya",
          "pronouns": "she/her",
          "bio": "Soft mornings",
          "vibe_archetype": "Gentle guide",
          "onboarding_completed_at": "2026-07-01T12:00:00Z"
        }]
        """.data(using: .utf8)!

        let profile = try OwnProfileDecoder.decode(json)
        XCTAssertEqual(profile.userId, "11111111-1111-4111-8111-111111111111")
        XCTAssertEqual(profile.displayName, "Maya")
        XCTAssertEqual(profile.pronouns, "she/her")
        XCTAssertEqual(profile.bio, "Soft mornings")
        XCTAssertEqual(profile.vibeArchetype, "Gentle guide")
        XCTAssertTrue(profile.isOnboardingComplete)
    }

    func testDecoderAllowsNullableOptionalFields() throws {
        let json = """
        [{
          "user_id": "11111111-1111-4111-8111-111111111111",
          "display_name": "Eli",
          "pronouns": null,
          "bio": null,
          "vibe_archetype": null,
          "onboarding_completed_at": null
        }]
        """.data(using: .utf8)!

        let profile = try OwnProfileDecoder.decode(json)
        XCTAssertEqual(profile.displayName, "Eli")
        XCTAssertNil(profile.pronouns)
        XCTAssertNil(profile.bio)
        XCTAssertFalse(profile.isOnboardingComplete)
    }

    func testDecoderFailsClosedOnEmptyArray() {
        XCTAssertThrowsError(try OwnProfileDecoder.decode(Data("[]".utf8))) { error in
            guard case .decoding = error as? ParticipantReadFailure else {
                return XCTFail("expected decoding failure")
            }
        }
    }

    func testDecoderFailsClosedOnMultipleRows() {
        let json = """
        [
          {"user_id":"a","display_name":"One"},
          {"user_id":"b","display_name":"Two"}
        ]
        """.data(using: .utf8)!
        XCTAssertThrowsError(try OwnProfileDecoder.decode(json)) { error in
            guard case .decoding = error as? ParticipantReadFailure else {
                return XCTFail("expected decoding failure")
            }
        }
    }

    func testDecoderFailsClosedOnMissingDisplayName() {
        let json = Data(#"[{"user_id":"a"}]"#.utf8)
        XCTAssertThrowsError(try OwnProfileDecoder.decode(json))
    }

    func testClientFailsClosedWithoutConfiguration() async {
        let client = SupabaseOwnProfileClient(
            configuration: .failure(.missingConfiguration("no config")),
            credentials: .success(ParticipantSessionCredentials(accessToken: "token")),
            http: FixedHTTPPerformer(result: .failure(URLError(.notConnectedToInternet)))
        )
        let state = await client.fetchOwnProfile()
        XCTAssertEqual(state, .missingConfiguration("no config"))
    }

    func testClientFailsClosedWithoutSession() async {
        let client = SupabaseOwnProfileClient(
            configuration: .success(
                ParticipantServerConfiguration(
                    supabaseURL: URL(string: "https://example.supabase.co")!,
                    anonKey: "anon"
                )
            ),
            credentials: .failure(.unauthenticated("no session")),
            http: FixedHTTPPerformer(result: .failure(URLError(.notConnectedToInternet)))
        )
        let state = await client.fetchOwnProfile()
        XCTAssertEqual(state, .unauthenticated("no session"))
    }

    func testClientLoadsDecodedProfileFromSuccessfulHTTP() async {
        let body = """
        [{
          "user_id": "11111111-1111-4111-8111-111111111111",
          "display_name": "River",
          "pronouns": "they/them",
          "bio": null,
          "vibe_archetype": "Quiet spark",
          "onboarding_completed_at": "2026-07-10T00:00:00Z"
        }]
        """.data(using: .utf8)!
        let response = HTTPURLResponse(
            url: URL(string: "https://example.supabase.co/rest/v1/profiles")!,
            statusCode: 200,
            httpVersion: nil,
            headerFields: nil
        )!
        let client = SupabaseOwnProfileClient(
            configuration: .success(
                ParticipantServerConfiguration(
                    supabaseURL: URL(string: "https://example.supabase.co")!,
                    anonKey: "anon"
                )
            ),
            credentials: .success(ParticipantSessionCredentials(accessToken: "token")),
            http: FixedHTTPPerformer(result: .success((body, response)))
        )
        let state = await client.fetchOwnProfile()
        guard case .loaded(let profile) = state else {
            return XCTFail("expected loaded state, got \(state)")
        }
        XCTAssertEqual(profile.displayName, "River")
        XCTAssertEqual(profile.vibeArchetype, "Quiet spark")
        XCTAssertTrue(profile.isOnboardingComplete)
    }

    func testClientFailsClosedOnHTTPErrorWithoutFabricatingData() async {
        let response = HTTPURLResponse(
            url: URL(string: "https://example.supabase.co/rest/v1/profiles")!,
            statusCode: 401,
            httpVersion: nil,
            headerFields: nil
        )!
        let client = SupabaseOwnProfileClient(
            configuration: .success(
                ParticipantServerConfiguration(
                    supabaseURL: URL(string: "https://example.supabase.co")!,
                    anonKey: "anon"
                )
            ),
            credentials: .success(ParticipantSessionCredentials(accessToken: "token")),
            http: FixedHTTPPerformer(result: .success((Data(), response)))
        )
        let state = await client.fetchOwnProfile()
        guard case .unavailable(let message) = state else {
            return XCTFail("expected unavailable state, got \(state)")
        }
        XCTAssertTrue(message.contains("401"))
        XCTAssertTrue(state.isFailClosed)
    }
}

/// Shared with TrustSignalsTests via same module tests target.
struct FixedHTTPPerformer: HTTPPerforming {
    let result: Result<(Data, URLResponse), Error>

    func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        try result.get()
    }
}
