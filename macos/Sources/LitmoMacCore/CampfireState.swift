import Foundation

public enum CampfirePractice: String, CaseIterable, Identifiable, Sendable {
    case circle = "Circle"
    case quiet = "Quiet"
    case digital = "Digital"
    public var id: Self { self }
}

public struct CircleCampfireState: Equatable, Sendable {
    public private(set) var readiness: [Bool]
    public private(set) var isActive = false

    public init(participantCount: Int = 2) {
        readiness = Array(repeating: false, count: min(max(participantCount, 2), 8))
    }

    public var participantCount: Int { readiness.count }
    public var canStart: Bool { !isActive && readiness.allSatisfy { $0 } }

    public mutating func setParticipantCount(_ count: Int) {
        readiness = Array(repeating: false, count: min(max(count, 2), 8))
        isActive = false
    }

    public mutating func toggleReady(at index: Int) {
        guard readiness.indices.contains(index), !isActive else { return }
        readiness[index].toggle()
    }

    @discardableResult
    public mutating func start() -> Bool {
        guard canStart else { return false }
        isActive = true
        return true
    }

    public mutating func pause() {
        isActive = false
        readiness = Array(repeating: false, count: readiness.count)
    }
}

public struct TimedCampfireState: Equatable, Sendable {
    public private(set) var duration: TimeInterval
    public private(set) var startedAt: Date?
    public private(set) var pausedRemaining: TimeInterval?
    public static let allowedMinutes = [5, 10, 20]

    public init(minutes: Int = 5) {
        duration = TimeInterval(Self.allowedMinutes.contains(minutes) ? minutes : 5) * 60
    }

    public var isRunning: Bool { startedAt != nil && pausedRemaining == nil }
    public var isPaused: Bool { pausedRemaining != nil }

    public mutating func select(minutes: Int) {
        guard Self.allowedMinutes.contains(minutes), startedAt == nil else { return }
        duration = TimeInterval(minutes * 60)
        pausedRemaining = nil
    }

    public mutating func start(at now: Date = .now) {
        guard startedAt == nil else { return }
        startedAt = now
        pausedRemaining = nil
    }

    public mutating func pause(at now: Date = .now) {
        guard isRunning else { return }
        pausedRemaining = remaining(at: now)
    }

    public mutating func resume(at now: Date = .now) {
        guard let pausedRemaining else { return }
        startedAt = now.addingTimeInterval(-(duration - pausedRemaining))
        self.pausedRemaining = nil
    }

    public mutating func reset() {
        startedAt = nil
        pausedRemaining = nil
    }

    public func remaining(at now: Date = .now) -> TimeInterval {
        if let pausedRemaining { return pausedRemaining }
        guard let startedAt else { return duration }
        return max(0, duration - now.timeIntervalSince(startedAt))
    }
}

public struct QuietCampfireState: Equatable, Sendable {
    public private(set) var startedAt: Date?
    public private(set) var accumulated: TimeInterval = 0

    public init() {}
    public var isRunning: Bool { startedAt != nil }

    public mutating func start(at now: Date = .now) {
        guard startedAt == nil else { return }
        startedAt = now
    }

    public mutating func pause(at now: Date = .now) {
        guard let startedAt else { return }
        accumulated += max(0, now.timeIntervalSince(startedAt))
        self.startedAt = nil
    }

    public mutating func reset() {
        startedAt = nil
        accumulated = 0
    }

    public func elapsed(at now: Date = .now) -> TimeInterval {
        accumulated + (startedAt.map { max(0, now.timeIntervalSince($0)) } ?? 0)
    }
}

public enum PlatformAuthority: Sendable {
    public static let activeSessions = "Active physical sessions and Soft Signal remain phone-first."
    public static let server = "Consent, authorization, and staff decisions remain server-authoritative."
    public static let localCampfire = "Campfire state stays on this Mac and is not a consent record."
    public static let trustHistory =
        "Self trust facts are server-authoritative and never a safety score. They never grant consent."
    public static let ownProfile =
        "Your profile is server-authoritative and read-only here. A profile never grants consent or proves safety."
}
