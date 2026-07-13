// swift-tools-version: 6.0
//
// LitmoBuildMode — Swift Package Manager mirror of app/config dual-mode flags.
//
// WHAT: Compile-time MAXIMUM_MODE / APP_STORE_SAFE for native macOS (and future
//       native clients). Parity with TypeScript app/config/buildMode.ts.
// WHY:  macOS participant app must show full consent chrome; cannot silently
//       ship App Store Safe flags on desktop. iOS native (if added later) sets
//       APP_STORE_SAFE via swiftSettings define.
// CONSENT: Soft Signal stop authority is always compiled true in FeatureFlags.
// SEE: docs/DUAL_MODE_ARCHITECTURE.md, docs/adr/0060-dual-build-modes.md
//
import PackageDescription

let package = Package(
    name: "LitmoBuildMode",
    platforms: [
        .macOS(.v15),
        .iOS(.v17),
    ],
    products: [
        .library(
            name: "LitmoBuildMode",
            targets: ["LitmoBuildMode"]
        ),
    ],
    targets: [
        .target(
            name: "LitmoBuildMode",
            path: "Sources/LitmoBuildMode",
            swiftSettings: [
                // Default package consumers (macOS XcodeGen) get MAXIMUM_MODE.
                // iOS consumers must pass APP_STORE_SAFE via dependent target
                // SWIFT_ACTIVE_COMPILATION_CONDITIONS or swiftSettings.
                .define("MAXIMUM_MODE", .when(platforms: [.macOS])),
                .define("APP_STORE_SAFE", .when(platforms: [.iOS])),
            ]
        ),
        .testTarget(
            name: "LitmoBuildModeTests",
            dependencies: ["LitmoBuildMode"],
            path: "Tests/LitmoBuildModeTests"
        ),
    ]
)
