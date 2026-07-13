import Foundation
import LitmoWatchHaptics

#if os(watchOS)
import WatchKit
#endif

/// Plays Litmo Taptic sequences. Soft Signal never blocked on errors.
public final class LitmoTapticPlayer: @unchecked Sendable {
  public init() {}

  public func play(lexeme: LitmoWatchLexeme, intensityScale: Double = 1.0) {
    let sequence = LitmoWatchPhraseLibrary.sequence(for: lexeme)
    Task {
      for call in sequence {
        switch call.kind {
        case .delay:
          let ms = call.delayMs ?? 0
          if ms > 0 {
            try? await Task.sleep(nanoseconds: UInt64(ms) * 1_000_000)
          }
        case .taptic:
          await playStyle(call.style, intensity: (call.intensity ?? 0.5) * intensityScale)
        }
      }
    }
  }

  @MainActor
  private func playStyle(_ style: LitmoTapticStyle?, intensity: Double) async {
    #if os(watchOS)
    let device = WKInterfaceDevice.current()
    // Map Litmo styles onto available WatchKit haptic types.
    // Soft Signal uses notification-like patterns; presence uses click.
    switch style {
    case .softSignalTriple, .stop, .failure:
      device.play(.notification)
    case .directionDown:
      device.play(.directionDown)
    case .directionUp:
      device.play(.directionUp)
    case .success:
      device.play(.success)
    case .retry:
      device.play(.retry)
    case .start:
      device.play(.start)
    case .click, .clickSoft, .nudge, .strokeSegment, .heartbeat, .none:
      device.play(.click)
    }
    // intensity reserved for future Core Haptics continuous; WK types are discrete.
    _ = intensity
    #else
    _ = (style, intensity)
    #endif
  }
}
