// Dual-bind reminder complication — Need ∧ Leave-fear can coexist.
// Local copy only. No partner status. Soft Signal freeness first.
// See docs/WATCH_COMPLICATIONS.md · docs/NEED_SCARED_LEAVE.md

import WidgetKit
import SwiftUI

private let dualBindLines: [String] = [
    "Need ∧ leave-fear can coexist",
    "Both poles allowed",
    "Ask without pre-exile",
    "Soft Signal free either pole",
    "Need is not a crime",
    "Fear is data, not a verdict",
]

struct DualBindEntry: TimelineEntry {
    let date: Date
    let line: String
}

struct DualBindProvider: TimelineProvider {
    func placeholder(in context: Context) -> DualBindEntry {
        DualBindEntry(date: Date(), line: dualBindLines[0])
    }

    func getSnapshot(in context: Context, completion: @escaping (DualBindEntry) -> Void) {
        completion(entry(for: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DualBindEntry>) -> Void) {
        let now = Date()
        var entries: [DualBindEntry] = []
        // Calm 2-hour rotation — not spam, not FOMO.
        for offset in 0..<12 {
            guard let date = Calendar.current.date(byAdding: .hour, value: offset * 2, to: now) else { continue }
            entries.append(entry(for: date))
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }

    private func entry(for date: Date) -> DualBindEntry {
        let hour = Calendar.current.component(.hour, from: date)
        let line = dualBindLines[hour % dualBindLines.count]
        return DualBindEntry(date: date, line: line)
    }
}

struct DualBindComplicationView: View {
    var entry: DualBindEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("BOTH/AND")
                .font(.caption2.weight(.bold))
            Text(entry.line)
                .font(.caption2)
                .minimumScaleFactor(0.65)
                .lineLimit(3)
        }
        .accessibilityLabel("Dual bind reminder. \(entry.line). Soft Signal free.")
        .containerBackground(for: .widget) {
            Color.black.opacity(0.2)
        }
    }
}

struct DualBindComplication: Widget {
    let kind = "LitmoDualBindComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DualBindProvider()) { entry in
            DualBindComplicationView(entry: entry)
        }
        .configurationDisplayName("Litmo Dual Bind")
        .description("Need and leave-fear can coexist. Local only. Soft Signal free.")
        .supportedFamilies([.accessoryRectangular, .accessoryInline, .accessoryCircular])
    }
}
