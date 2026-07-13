import XCTest
@testable import LitmoBuildMode

final class BuildModeTests: XCTestCase {
    /// WHAT: Safety core is true in both static matrices.
    /// WHY: App Store Safe must never compile Soft Signal off.
    func testSafetyCoreAlwaysOn() {
        for flags in [LitmoFeatureFlags.maximum, LitmoFeatureFlags.appStore] {
            XCTAssertTrue(flags.softSignalStop)
            XCTAssertTrue(flags.consentDualSeal)
            XCTAssertTrue(flags.ageGate)
            XCTAssertTrue(flags.profileIsNotConsent)
            XCTAssertTrue(flags.failClosedBoundaries)
        }
    }

    /// WHAT: App Store disables RF/NFC/hardware/demo.
    func testAppStoreGatesReviewSensitiveSurfaces() {
        let f = LitmoFeatureFlags.appStore
        XCTAssertFalse(f.proximityRadar)
        XCTAssertFalse(f.nfcCarefulConnect)
        XCTAssertFalse(f.localMultipeerShare)
        XCTAssertFalse(f.hardwareSoftSignal)
        XCTAssertFalse(f.demoModeSurface)
        XCTAssertTrue(LitmoFeatureFlags.maximum.proximityRadar)
    }

    /// WHAT: Soft Signal copy never demands a reason.
    func testSoftSignalCopyForbidsReason() {
        for pack in [SoftSignalCopyPack.maximum, SoftSignalCopyPack.appStore] {
            XCTAssertFalse(pack.hint.lowercased().contains("why did you stop"))
            XCTAssertTrue(pack.hint.lowercased().contains("explanation") || pack.hint.lowercased().contains("no explanation"))
            XCTAssertTrue(pack.notEmergency.lowercased().contains("not emergency"))
        }
    }

    /// WHAT: Maximum button is Soft Signal; App Store is End session.
    func testSoftSignalButtonLabels() {
        XCTAssertTrue(SoftSignalCopyPack.maximum.button.contains("Soft Signal"))
        XCTAssertTrue(SoftSignalCopyPack.appStore.button.contains("End session"))
    }

    /// WHAT: Active mode is maximum on macOS package default.
    func testActiveModeOnMacOSDefault() throws {
        #if os(macOS)
        XCTAssertEqual(LitmoBuildModeRuntime.active, .maximum)
        XCTAssertTrue(LitmoBuildModeRuntime.isMaximumMode)
        #endif
    }
}
