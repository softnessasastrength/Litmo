import Foundation

/// One pending session request as returned by list_incoming / list_outgoing RPCs.
///
/// Display-only. Accepting, declining, or creating requests remains phone-first.
/// A listed request is never consent.
public struct SessionRequestSummary: Equatable, Sendable, Identifiable {
    public enum Direction: String, Equatable, Sendable {
        case incoming
        case outgoing
    }

    public let id: String
    public let direction: Direction
    public let counterpartUserId: String
    public let createdAt: String
    public let expiresAt: String

    public init(
        id: String,
        direction: Direction,
        counterpartUserId: String,
        createdAt: String,
        expiresAt: String
    ) {
        self.id = id
        self.direction = direction
        self.counterpartUserId = counterpartUserId
        self.createdAt = createdAt
        self.expiresAt = expiresAt
    }
}

public struct SessionRequestLists: Equatable, Sendable {
    public let incoming: [SessionRequestSummary]
    public let outgoing: [SessionRequestSummary]

    public init(incoming: [SessionRequestSummary], outgoing: [SessionRequestSummary]) {
        self.incoming = incoming
        self.outgoing = outgoing
    }

    public var isEmpty: Bool { incoming.isEmpty && outgoing.isEmpty }
    public var totalCount: Int { incoming.count + outgoing.count }
}

public typealias SessionRequestsLoadState = ParticipantReadOutcome<SessionRequestLists>

public enum SessionRequestListDecoder {
    public static func decodeIncoming(_ data: Data) throws -> [SessionRequestSummary] {
        try decode(data, direction: .incoming, counterpartKey: "requester_id")
    }

    public static func decodeOutgoing(_ data: Data) throws -> [SessionRequestSummary] {
        try decode(data, direction: .outgoing, counterpartKey: "recipient_id")
    }

    private static func decode(
        _ data: Data,
        direction: SessionRequestSummary.Direction,
        counterpartKey: String
    ) throws -> [SessionRequestSummary] {
        // Empty array is valid (no pending requests).
        let rows = try JSONFieldDecoding.objects(in: data)

        return try rows.map { row in
            guard
                let id = JSONFieldDecoding.stringValue(row["id"]),
                !id.isEmpty,
                let counterpart = JSONFieldDecoding.stringValue(row[counterpartKey]),
                !counterpart.isEmpty,
                let createdAt = JSONFieldDecoding.stringValue(row["created_at"]),
                !createdAt.isEmpty,
                let expiresAt = JSONFieldDecoding.stringValue(row["expires_at"]),
                !expiresAt.isEmpty
            else {
                throw ParticipantReadFailure.decoding(
                    "A session request row was incomplete. No substitute values were invented."
                )
            }
            return SessionRequestSummary(
                id: id,
                direction: direction,
                counterpartUserId: counterpart,
                createdAt: createdAt,
                expiresAt: expiresAt
            )
        }
    }
}
