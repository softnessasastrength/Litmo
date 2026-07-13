import XCTest
@testable import LitmoMacCore

final class TrustSignalsTests: XCTestCase {
    func testDecoderAcceptsArrayPayloadFromRPC() throws {
        let json = """
        [{
          "account_age_days": 12,
          "profile_complete": true,
          "adult_eligible": true,
          "completed_sessions": 3,
          "soft_signaled_sessions": 1,
          "safety_ended_sessions": 0
        }]
        """.data(using: .utf8)!

        let signals = try TrustSignalsDecoder.decode(json)
        XCTAssertEqual(signals.accountAgeDays, 12)
        XCTAssertTrue(signals.profileComplete)
        XCTAssertTrue(signals.adultEligible)
        XCTAssertEqual(signals.completedSessions, 3)
        XCTAssertEqual(signals.softSignaledSessions, 1)
        XCTAssertEqual(signals.safetyEndedSessions, 0)
    }

    func testDecoderFailsClosedOnEmptyArray() {
        let json = Data("[]".utf8)
        XCTAssertThrowsError(try TrustSignalsDecoder.decode(json)) { error in
            guard let failure = error as? ParticipantReadFailure else {
                return XCTFail("expected ParticipantReadFailure")
            }
            XCTAssertEqual(failure, .decoding("Trust signals were unavailable."))
        }
    }

    func testDecoderFailsClosedOnMissingFields() {
        let json = Data(#"[{"account_age_days": 1}]"#.utf8)
        XCTAssertThrowsError(try TrustSignalsDecoder.decode(json)) { error in
            guard case .decoding = error as? ParticipantReadFailure else {
                return XCTFail("expected decoding failure")
            }
        }
    }

    func testConfigurationRequiresURLAndAnonKey() {
        let missing = ParticipantServerConfiguration.fromEnvironment([:])
        guard case .failure(.missingConfiguration) = missing else {
            return XCTFail("expected missing configuration")
        }

        let incomplete = ParticipantServerConfiguration.fromEnvironment([
            "LITMO_SUPABASE_URL": "https://example.supabase.co",
        ])
        guard case .failure(.missingConfiguration) = incomplete else {
            return XCTFail("expected missing anon key")
        }

        let ok = ParticipantServerConfiguration.fromEnvironment([
            "LITMO_SUPABASE_URL": "https://example.supabase.co",
            "LITMO_SUPABASE_ANON_KEY": "anon-test",
        ])
        guard case .success(let config) = ok else {
            return XCTFail("expected success")
        }
        XCTAssertEqual(config.supabaseURL.host, "example.supabase.co")
        XCTAssertEqual(config.anonKey, "anon-test")
    }

    func testCredentialsFailClosedWithoutToken() {
        let result = ParticipantSessionCredentials.fromEnvironment([:])
        guard case .failure(.unauthenticated) = result else {
            return XCTFail("expected unauthenticated failure")
        }
    }

    func testClientFailsClosedWithoutConfiguration() async {
        let client = SupabaseTrustSignalsClient(
            configuration: .failure(.missingConfiguration("no config")),
            credentials: .success(ParticipantSessionCredentials(accessToken: "token")),
            http: FixedHTTPPerformer(result: .failure(URLError(.notConnectedToInternet)))
        )
        let state = await client.fetchMyTrustSignals()
        XCTAssertEqual(state, .missingConfiguration("no config"))
    }

    func testClientFailsClosedWithoutSession() async {
        let client = SupabaseTrustSignalsClient(
            configuration: .success(
                ParticipantServerConfiguration(
                    supabaseURL: URL(string: "https://example.supabase.co")!,
                    anonKey: "anon"
                )
            ),
            credentials: .failure(.unauthenticated("no session")),
            http: FixedHTTPPerformer(result: .failure(URLError(.notConnectedToInternet)))
        )
        let state = await client.fetchMyTrustSignals()
        XCTAssertEqual(state, .unauthenticated("no session"))
    }

    func testClientLoadsDecodedSignalsFromSuccessfulHTTP() async {
        let body = """
        [{
          "account_age_days": 4,
          "profile_complete": false,
          "adult_eligible": true,
          "completed_sessions": 0,
          "soft_signaled_sessions": 0,
          "safety_ended_sessions": 0
        }]
        """.data(using: .utf8)!
        let response = HTTPURLResponse(
            url: URL(string: "https://example.supabase.co/rest/v1/rpc/my_trust_signals")!,
            statusCode: 200,
            httpVersion: nil,
            headerFields: nil
        )!
        let client = SupabaseTrustSignalsClient(
            configuration: .success(
                ParticipantServerConfiguration(
                    supabaseURL: URL(string: "https://example.supabase.co")!,
                    anonKey: "anon"
                )
            ),
            credentials: .success(ParticipantSessionCredentials(accessToken: "token")),
            http: FixedHTTPPerformer(result: .success((body, response)))
        )

        let state = await client.fetchMyTrustSignals()
        guard case .loaded(let signals) = state else {
            return XCTFail("expected loaded state, got \(state)")
        }
        XCTAssertEqual(signals.accountAgeDays, 4)
        XCTAssertFalse(signals.profileComplete)
        XCTAssertTrue(signals.adultEligible)
    }

    func testClientFailsClosedOnHTTPErrorWithoutFabricatingData() async {
        let response = HTTPURLResponse(
            url: URL(string: "https://example.supabase.co/rest/v1/rpc/my_trust_signals")!,
            statusCode: 401,
            httpVersion: nil,
            headerFields: nil
        )!
        let client = SupabaseTrustSignalsClient(
            configuration: .success(
                ParticipantServerConfiguration(
                    supabaseURL: URL(string: "https://example.supabase.co")!,
                    anonKey: "anon"
                )
            ),
            credentials: .success(ParticipantSessionCredentials(accessToken: "token")),
            http: FixedHTTPPerformer(result: .success((Data(), response)))
        )
        let state = await client.fetchMyTrustSignals()
        guard case .unavailable(let message) = state else {
            return XCTFail("expected unavailable state, got \(state)")
        }
        XCTAssertTrue(message.contains("401"))
        XCTAssertTrue(state.isFailClosed)
    }
}

// FixedHTTPPerformer is defined in OwnProfileTests.swift for the shared test target.
