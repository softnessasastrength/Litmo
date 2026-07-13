import AppKit
import SwiftUI
import LitmoMacCore

@MainActor
final class SelfExportViewModel: ObservableObject {
    @Published private(set) var state: SelfExportLoadState = .idle
    @Published var copyNote: String?

    private let client: any SelfExportClient

    init(client: any SelfExportClient = SupabaseSelfExportClient.fromEnvironment()) {
        self.client = client
    }

    func load() async {
        state = .loading
        copyNote = nil
        state = await client.fetchSelfExport()
    }

    func copyJSON() {
        guard case .loaded(let summary) = state else { return }
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(summary.prettyJSON, forType: .string)
        copyNote = "Copied export JSON to the clipboard on this Mac only."
    }
}

struct SelfExportView: View {
    @StateObject private var model: SelfExportViewModel

    init(model: SelfExportViewModel = SelfExportViewModel()) {
        _model = StateObject(wrappedValue: model)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Export").font(.largeTitle.bold())
                    Text("Self-only portability summary from the server.")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }

                ParticipantAuthorityBanner(text: PlatformAuthority.selfExport)

                content
                    .frame(maxWidth: 720, alignment: .leading)

                HStack(spacing: 12) {
                    Button("Refresh") {
                        Task { await model.load() }
                    }
                    .disabled({
                        if case .loading = model.state { return true }
                        return false
                    }())
                    .keyboardShortcut("r", modifiers: [.command])

                    if case .loaded = model.state {
                        Button("Copy JSON") {
                            model.copyJSON()
                        }
                    }
                }

                if let note = model.copyNote {
                    Text(note)
                        .font(.callout)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(32)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .navigationTitle("Export")
        .task { await model.load() }
    }

    @ViewBuilder
    private var content: some View {
        switch model.state {
        case .loaded(let summary):
            loadedContent(summary)
        default:
            model.state.failClosedContent(
                loadingLabel: "Loading your export…",
                unavailableTitle: "Export unavailable",
                fabricationNote: "No export payload is fabricated when the server or session is unavailable."
            )
        }
    }

    private func loadedContent(_ summary: SelfExportSummary) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            if let generatedAt = summary.generatedAt {
                ParticipantFactRow(title: "Generated at", value: generatedAt)
            }

            ForEach(summary.categories) { category in
                GroupBox {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(category.title)
                            .font(.headline)
                        if let count = category.itemCount {
                            Text("\(count) item\(count == 1 ? "" : "s")")
                                .foregroundStyle(.secondary)
                        } else if category.present {
                            Text("Present")
                                .foregroundStyle(.secondary)
                        } else {
                            Text("Not present")
                                .foregroundStyle(.secondary)
                        }
                        Text(category.key)
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(8)
                }
            }

            Text("This is an engineering portability primitive, not a claim of legally complete data access. Private encrypted notes are not included for staff; copy stays on this device until you paste it somewhere else.")
                .font(.callout)
                .foregroundStyle(.secondary)
        }
    }
}
