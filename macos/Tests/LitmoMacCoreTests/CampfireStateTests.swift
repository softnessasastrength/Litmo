import XCTest
@testable import LitmoMacCore

final class CampfireStateTests: XCTestCase {
    func testCircleClampsParticipantCountAndRequiresUnanimity() {
        var state = CircleCampfireState(participantCount: 20)
        XCTAssertEqual(state.participantCount, 8)
        XCTAssertFalse(state.start())
        for index in state.readiness.indices { state.toggleReady(at: index) }
        XCTAssertTrue(state.canStart)
        XCTAssertTrue(state.start())
        XCTAssertTrue(state.isActive)
    }

    func testCirclePauseRequiresFreshReadiness() {
        var state = CircleCampfireState(participantCount: 2)
        state.toggleReady(at: 0)
        state.toggleReady(at: 1)
        XCTAssertTrue(state.start())
        state.pause()
        XCTAssertFalse(state.isActive)
        XCTAssertEqual(state.readiness, [false, false])
        XCTAssertFalse(state.canStart)
    }

    func testTimedPracticePausesAndResumesWithoutLosingTime() {
        let origin = Date(timeIntervalSince1970: 1_000)
        var state = TimedCampfireState(minutes: 5)
        state.start(at: origin)
        state.pause(at: origin.addingTimeInterval(30))
        XCTAssertEqual(state.remaining(at: origin.addingTimeInterval(60)), 270, accuracy: 0.001)
        state.resume(at: origin.addingTimeInterval(100))
        XCTAssertEqual(state.remaining(at: origin.addingTimeInterval(110)), 260, accuracy: 0.001)
    }

    func testQuietPracticeTracksOnlyElapsedTime() {
        let origin = Date(timeIntervalSince1970: 1_000)
        var state = QuietCampfireState()
        state.start(at: origin)
        state.pause(at: origin.addingTimeInterval(12))
        state.start(at: origin.addingTimeInterval(20))
        XCTAssertEqual(state.elapsed(at: origin.addingTimeInterval(25)), 17, accuracy: 0.001)
        state.reset()
        XCTAssertEqual(state.elapsed(at: origin.addingTimeInterval(30)), 0, accuracy: 0.001)
    }
}
