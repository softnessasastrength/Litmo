import Foundation

/// Categories returned by `public.export_my_data()` (migration 036).
///
/// Engineering portability primitive — not a claim of legally complete data access.
public struct SelfExportCategory: Equatable, Sendable, Identifiable {
    public var id: String { key }
    public let key: String
    public let title: String
    public let itemCount: Int?
    public let present: Bool

    public init(key: String, title: String, itemCount: Int?, present: Bool) {
        self.key = key
        self.title = title
        self.itemCount = itemCount
        self.present = present
    }
}

public struct SelfExportSummary: Equatable, Sendable {
    public let generatedAt: String?
    public let categories: [SelfExportCategory]
    /// Pretty JSON for user-initiated copy only; never auto-shared.
    public let prettyJSON: String

    public init(generatedAt: String?, categories: [SelfExportCategory], prettyJSON: String) {
        self.generatedAt = generatedAt
        self.categories = categories
        self.prettyJSON = prettyJSON
    }
}

public typealias SelfExportLoadState = ParticipantReadOutcome<SelfExportSummary>

public enum SelfExportDecoder {
    private static let knownOrder: [(key: String, title: String)] = [
        ("profile", "Profile"),
        ("touch_profile_versions", "Touch profile versions"),
        ("consent_preference_versions", "Consent preference versions"),
        ("sessions", "Sessions"),
        ("reports_submitted", "Reports you submitted"),
        ("trust_events", "Trust events"),
    ]

    public static func decode(_ data: Data) throws -> SelfExportSummary {
        let object = try JSONFieldDecoding.object(from: data)
        guard let root = object as? [String: Any] else {
            throw ParticipantReadFailure.decoding(
                "Export response was not an object. No substitute export is shown."
            )
        }

        let generatedAt = JSONFieldDecoding.stringValue(root["generated_at"])
        var categories: [SelfExportCategory] = []

        for entry in knownOrder {
            let value = root[entry.key]
            let present = value != nil && !(value is NSNull)
            let count = arrayCount(value)
            categories.append(
                SelfExportCategory(
                    key: entry.key,
                    title: entry.title,
                    itemCount: count,
                    present: present
                )
            )
        }

        // Surface unexpected top-level keys without inventing meaning.
        let knownKeys = Set(knownOrder.map(\.key)).union(["generated_at"])
        for key in root.keys.sorted() where !knownKeys.contains(key) {
            let value = root[key]
            categories.append(
                SelfExportCategory(
                    key: key,
                    title: key,
                    itemCount: arrayCount(value),
                    present: value != nil && !(value is NSNull)
                )
            )
        }

        let pretty: String
        if let jsonObject = try? JSONSerialization.jsonObject(with: data),
           JSONSerialization.isValidJSONObject(jsonObject),
           let prettyData = try? JSONSerialization.data(
            withJSONObject: jsonObject,
            options: [.prettyPrinted, .sortedKeys]
           ),
           let prettyString = String(data: prettyData, encoding: .utf8)
        {
            pretty = prettyString
        } else if let raw = String(data: data, encoding: .utf8), !raw.isEmpty {
            pretty = raw
        } else {
            throw ParticipantReadFailure.decoding(
                "Export payload could not be re-encoded. No substitute export is shown."
            )
        }

        return SelfExportSummary(
            generatedAt: generatedAt,
            categories: categories,
            prettyJSON: pretty
        )
    }

    private static func arrayCount(_ value: Any?) -> Int? {
        if let array = value as? [Any] { return array.count }
        return nil
    }
}
