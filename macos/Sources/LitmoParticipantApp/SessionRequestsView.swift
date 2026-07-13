import SwiftUI
import LitmoMacCore

@MainActor
final class SessionRequestsViewModel: ObservableObject {
    @Published private(set) var state: SessionRequestsLoadState = .idle

    private let client: any SessionRequestsClient

    init(client: any SessionRequestsClient = SupabaseSessionRequestsClient.fromEnvironment()) {
        self.client = client
    }

    func load() async {
        state = .loading
        state = await client.fetchSessionRequests()
    }
}

struct SessionRequestsView: View {
    @StateObject private var model: SessionRequestsViewModel

    init(model: SessionRequestsViewModel = SessionRequestsViewModel()) {
        _model = StateObject(wrappedValue: model)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Requests").font(.largeTitle.bold())
                    Text("Read-only view of pending session requests.")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }

                ParticipantAuthorityBanner(text: PlatformAuthority.sessionRequests)

                content
                    .frame(maxWidth: 720, alignment: .leading)

                Button("Refresh") {
                    Task { await model.load() }
                }
                .disabled({
                    if case .loading = model.state { return true }
                    return false
                }())
                .keyboardShortcut("r", modifiers: [.command])
            }
            .padding(32)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .navigationTitle("Requests")
        .task { await model.load() }
    }

    @ViewBuilder
    private var content: some View {
        switch model.state {
        case .loaded(let lists):
            loadedContent(lists)
        default:
            model.state.failClosedContent(
                loadingLabel: "Loading pending requests…",
                unavailableTitle: "Requests unavailable",
                fabricationNote: "No request rows are fabricated when the server or session is unavailable."
            )
        }
    }

    private func loadedContent(_ lists: SessionRequestLists) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            if lists.isEmpty {
                GroupBox {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Nothing pending", systemImage: "tray")
                            .font(.title3.bold())
                        Text("No incoming or outgoing session requests right now. Accepting, declining, and creating stay phone-first.")
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                }
            } else {
                requestSection(title: "Incoming", items: lists.incoming)
                requestSection(title: "Outgoing", items: lists.outgoing)
            }

            Text("A listed request is never consent. Soft Signal and active physical sessions remain on the phone.")
                .font(.callout)
                .foregroundStyle(.secondary)
        }
    }

    @ViewBuilder
    private func requestSection(title: String, items: [SessionRequestSummary]) -> some View {
        if items.isEmpty { EmptyView() }
        else {
            VStack(alignment: .leading, spacing: 10) {
                Text(title).font(.title2.bold())
                ForEach(items) { item in
                    GroupBox {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(shortId(item.id))
                                .font(.headline)
                                .textSelection(.enabled)
                            Text("With \(shortId(item.counterpartUserId))")
                                .foregroundStyle(.secondary)
                            Text("Created \(item.createdAt)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("Expires \(item.expiresAt)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(8)
                    }
                }
            }
        }
    }

    private func shortId(_ value: String) -> String {
        let compact = value.replacingOccurrences(of: "-", with: "")
        if compact.count <= 12 { return value }
        return String(value.prefix(8)) + "…"
    }
}
