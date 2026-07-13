import XCTest
@testable import LitmoWatchHaptics

final class LitmoWatchHapticsTests: XCTestCase {
  func testSoftSignalSequenceIsNonEmpty() {
    let seq = LitmoWatchPhraseLibrary.sequence(for: .softSignal)
    XCTAssertGreaterThanOrEqual(seq.count, 3)
  }

  func testKillCommandEndsSessionWhenIdPresent() {
    let cmd = LitmoSoftSignalKillCommand(
      watchDeviceId: "w1",
      sessionId: "s1",
      at: "2026-07-13T00:00:00Z"
    )
    XCTAssertTrue(cmd.killAllHaptics)
    XCTAssertTrue(cmd.endSession)
  }
}
