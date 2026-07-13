import Foundation

/// Litmo Taptic language — Watch-side pure mapping (no UI).
/// Soft Signal is sacred: triple + decay; not a notification.
/// Haptics never mean peer consent or remote presence.
public enum LitmoWatchLexeme: String, Codable, Sendable {
  case presence
  case gentleTap = "gentle_tap"
  case strongTap = "strong_tap"
  case wristStroke = "wrist_stroke"
  case coRegulationHeartbeat = "co_regulation_heartbeat"
  case checkInGentle = "check_in_gentle"
  case softSignal = "soft_signal"
  case boundaryQuestion = "boundary_question"
}

public enum LitmoTapticStyle: String, Codable, Sendable {
  case clickSoft
  case click
  case nudge
  case strokeSegment
  case heartbeat
  case softSignalTriple
  case directionUp
  case directionDown
  case stop
}

public struct LitmoTapticCall: Codable, Sendable {
  public enum Kind: String, Codable, Sendable {
    case taptic
    case delay
  }

  public var kind: Kind
  public var style: LitmoTapticStyle?
  public var intensity: Double?
  public var delayMs: Int?

  public static func taptic(_ style: LitmoTapticStyle, intensity: Double) -> LitmoTapticCall {
    LitmoTapticCall(kind: .taptic, style: style, intensity: intensity, delayMs: nil)
  }

  public static func delay(_ ms: Int) -> LitmoTapticCall {
    LitmoTapticCall(kind: .delay, style: nil, intensity: nil, delayMs: ms)
  }
}

public enum LitmoWatchPhraseLibrary {
  /// Soft Signal — cannot be overridden by other patterns.
  public static let softSignal: [LitmoTapticCall] = [
    .taptic(.softSignalTriple, intensity: 0.85),
    .delay(40),
    .taptic(.stop, intensity: 0.7),
    .delay(50),
    .taptic(.directionDown, intensity: 0.55),
  ]

  public static let gentleTap: [LitmoTapticCall] = [
    .taptic(.clickSoft, intensity: 0.25),
  ]

  public static let presence: [LitmoTapticCall] = [
    .taptic(.nudge, intensity: 0.35),
    .delay(90),
    .taptic(.nudge, intensity: 0.35),
  ]

  public static let coRegulationHeartbeat: [LitmoTapticCall] = [
    .taptic(.heartbeat, intensity: 0.28),
    .delay(180),
    .taptic(.heartbeat, intensity: 0.22),
    .delay(520),
  ]

  public static func sequence(for lexeme: LitmoWatchLexeme) -> [LitmoTapticCall] {
    switch lexeme {
    case .softSignal: return softSignal
    case .gentleTap: return gentleTap
    case .presence: return presence
    case .coRegulationHeartbeat: return coRegulationHeartbeat
    case .strongTap: return [.taptic(.click, intensity: 0.75)]
    case .wristStroke:
      return [
        .taptic(.strokeSegment, intensity: 0.3),
        .delay(55),
        .taptic(.strokeSegment, intensity: 0.35),
        .delay(55),
        .taptic(.strokeSegment, intensity: 0.3),
      ]
    case .checkInGentle: return [.taptic(.nudge, intensity: 0.22)]
    case .boundaryQuestion:
      return [
        .taptic(.directionUp, intensity: 0.3),
        .delay(100),
        .taptic(.directionUp, intensity: 0.3),
      ]
    }
  }
}

/// Global Soft Signal kill payload — mirrors TS SoftSignalKillCommand.
public struct LitmoSoftSignalKillCommand: Codable, Sendable {
  public var kind: String = "soft_signal_kill"
  public var sourceDeviceId: String
  public var sourceClass: String
  public var sessionId: String?
  public var at: String
  public var killAllHaptics: Bool = true
  public var endSession: Bool

  public init(watchDeviceId: String, sessionId: String?, at: String) {
    self.sourceDeviceId = watchDeviceId
    self.sourceClass = "watch"
    self.sessionId = sessionId
    self.at = at
    self.endSession = sessionId != nil
  }
}
