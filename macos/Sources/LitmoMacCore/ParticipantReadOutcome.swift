import Foundation

/// Shared fail-closed load states for server-backed participant reads.
public enum ParticipantReadOutcome<Value: Equatable & Sendable>: Equatable, Sendable {
    case idle
    case loading
    case missingConfiguration(String)
    case unauthenticated(String)
    case unavailable(String)
    case loaded(Value)

    public var isFailClosed: Bool {
        switch self {
        case .loaded, .loading, .idle:
            return false
        case .missingConfiguration, .unauthenticated, .unavailable:
            return true
        }
    }

    public static func from(failure: ParticipantReadFailure) -> ParticipantReadOutcome<Value> {
        switch failure {
        case .missingConfiguration(let message):
            return .missingConfiguration(message)
        case .unauthenticated(let message):
            return .unauthenticated(message)
        case .transport(let message), .decoding(let message), .server(let message):
            return .unavailable(message)
        }
    }
}

/// Presentation-safe JSON field helpers. Never invent defaults for missing values.
public enum JSONFieldDecoding {
    public static func object(from data: Data) throws -> Any {
        do {
            return try JSONSerialization.jsonObject(with: data, options: [])
        } catch {
            throw ParticipantReadFailure.decoding("Response was not valid JSON.")
        }
    }

    public static func firstObject(in data: Data) throws -> [String: Any] {
        let object = try object(from: data)
        if let array = object as? [Any] {
            guard let first = array.first as? [String: Any] else {
                throw ParticipantReadFailure.decoding("Response did not include a row.")
            }
            return first
        }
        if let dict = object as? [String: Any] {
            return dict
        }
        throw ParticipantReadFailure.decoding("Response shape was not recognized.")
    }

    public static func objects(in data: Data) throws -> [[String: Any]] {
        let object = try object(from: data)
        if let array = object as? [Any] {
            return try array.map { item in
                guard let row = item as? [String: Any] else {
                    throw ParticipantReadFailure.decoding("Response array contained a non-object row.")
                }
                return row
            }
        }
        if let dict = object as? [String: Any] {
            return [dict]
        }
        throw ParticipantReadFailure.decoding("Response shape was not recognized.")
    }

    public static func intValue(_ raw: Any?) -> Int? {
        switch raw {
        case let value as Int:
            return value
        case let value as NSNumber:
            return value.intValue
        case let value as String:
            return Int(value)
        default:
            return nil
        }
    }

    public static func boolValue(_ raw: Any?) -> Bool? {
        switch raw {
        case let value as Bool:
            return value
        case let value as NSNumber:
            return value.boolValue
        default:
            return nil
        }
    }

    public static func stringValue(_ raw: Any?) -> String? {
        switch raw {
        case let value as String:
            return value
        case is NSNull, nil:
            return nil
        default:
            return nil
        }
    }
}
