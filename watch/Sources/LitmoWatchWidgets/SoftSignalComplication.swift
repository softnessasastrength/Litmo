import WidgetKit
import SwiftUI

/// Soft Signal complication — free stop, never social badges or streaks.
struct SoftSignalProvider: TimelineProvider {
  func placeholder(in context: Context) -> SoftSignalEntry {
    SoftSignalEntry(date: Date(), label: "Soft Signal")
  }

  func getSnapshot(in context: Context, completion: @escaping (SoftSignalEntry) -> Void) {
    completion(SoftSignalEntry(date: Date(), label: "Soft Signal"))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SoftSignalEntry>) -> Void) {
    let entry = SoftSignalEntry(date: Date(), label: "Soft Signal")
    completion(Timeline(entries: [entry], policy: .never))
  }
}

struct SoftSignalEntry: TimelineEntry {
  let date: Date
  let label: String
}

struct SoftSignalComplicationView: View {
  var entry: SoftSignalEntry

  var body: some View {
    // Calm face: no peer names, no counts, no urgency red spam.
    VStack(spacing: 2) {
      Image(systemName: "hand.raised.fill")
        .font(.caption)
      Text(entry.label)
        .font(.caption2)
        .minimumScaleFactor(0.6)
    }
    .accessibilityLabel("Soft Signal. Open Litmo Watch to stop. No explanation needed.")
  }
}

@main
struct LitmoWatchWidgets: WidgetBundle {
  var body: some Widget {
    SoftSignalWidget()
    ReassuranceComplication()
    DualBindComplication()
  }
}

struct SoftSignalWidget: Widget {
  let kind = "LitmoSoftSignalComplication"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: SoftSignalProvider()) { entry in
      SoftSignalComplicationView(entry: entry)
    }
    .configurationDisplayName("Litmo Soft Signal")
    .description("Quick Soft Signal — stop free. Not notifications. Not a social badge.")
    .supportedFamilies([.accessoryCircular, .accessoryInline, .accessoryRectangular])
  }
}
