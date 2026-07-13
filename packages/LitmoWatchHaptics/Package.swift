// swift-tools-version: 5.9
import PackageDescription

/// Shared Swift types for Litmo Watch / Taptic Soft Signal.
/// Aligns with @litmo/domain hapticWatch lexemes — no peer consent encoding.
let package = Package(
  name: "LitmoWatchHaptics",
  platforms: [
    .watchOS(.v9),
    .iOS(.v15),
  ],
  products: [
    .library(name: "LitmoWatchHaptics", targets: ["LitmoWatchHaptics"]),
  ],
  targets: [
    .target(name: "LitmoWatchHaptics", path: "Sources"),
    .testTarget(
      name: "LitmoWatchHapticsTests",
      dependencies: ["LitmoWatchHaptics"],
      path: "Tests"
    ),
  ]
)
