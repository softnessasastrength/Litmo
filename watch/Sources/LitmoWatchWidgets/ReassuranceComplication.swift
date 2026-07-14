// Reassurance complication — local copy only, no FOMO, no partner status.
// Soft Signal freeness outranks engagement. See docs/WATCH_COMPLICATIONS.md

import WidgetKit
import SwiftUI

private let reassuranceLines: [String] = [
    "Need is not a crime",
    "Soft Signal free",
    "You are not too much",
    "Both poles allowed",
    "Exit is success",
    "Intensity ≠ unlovable",
]

struct ReassuranceEntry: TimelineEntry {
    let date: Date
    let line: String
}

struct ReassuranceProvider: TimelineProvider {
    func placeholder(in context: Context) -> ReassuranceEntry {
        ReassuranceEntry(date: Date(), line: reassuranceLines[0])
    }

    func getSnapshot(in context: Context, completion: @escaping (ReassuranceEntry) -> Void) {
        completion(entry(for: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ReassuranceEntry>) -> Void) {
        let now = Date()
        var entries: [ReassuranceEntry] = []
        // Calm hourly rotation — not spam.
        for hourOffset in 0..<12 {
            guard let date = Calendar.current.date(byAdding: .hour, value: hourOffset, to: now) else { continue }
            entries.append(entry(for: date))
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }

    private func entry(for date: Date) -> ReassuranceEntry {
        let hour = Calendar.current.component(.hour, from: date)
        let line = reassuranceLines[hour % reassuranceLines.count]
        return ReassuranceEntry(date: date, line: line)
    }
}

struct ReassuranceComplicationView: View {
    var entry: ReassuranceEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("LITMO")
                .font(.caption2.weight(.bold))
            Text(entry.line)
                .font(.caption2)
                .minimumScaleFactor(0.7)
                .lineLimit(3)
        }
        .containerBackground(for: .widget) {
            Color.black.opacity(0.2)
        }
    }
}

struct ReassuranceComplication: Widget {
    let kind = "ReassuranceComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ReassuranceProvider()) { entry in
            ReassuranceComplicationView(entry: entry)
        }
        .configurationDisplayName("Litmo Reassurance")
        .description("Local soft lines. No partner status. Soft Signal freeness first.")
        .supportedFamilies([.accessoryRectangular, .accessoryInline, .accessoryCircular])
    }
}
