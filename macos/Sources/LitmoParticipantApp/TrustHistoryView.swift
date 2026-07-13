import SwiftUI
import LitmoMacCore

@MainActor
final class TrustHistoryViewModel: ObservableObject {
    @Published private(set) var state: TrustHistoryLoadState = .idle

    private let client: any TrustSignalsClient

    init(client: any TrustSignalsClient = SupabaseTrustSignalsClient.fromEnvironment()) {
        self.client = client
    }

    func load() async {
        state = .loading
        state = await client.fetchMyTrustSignals()
    }
}

struct TrustHistoryView: View {
    @StateObject private var model: TrustHistoryViewModel

    init(model: TrustHistoryViewModel = TrustHistoryViewModel()) {
        _model = StateObject(wrappedValue: model)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Trust history").font(.largeTitle.bold())
                    Text("Specific facts about your own account — never a safety score.")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }

                ParticipantAuthorityBanner(text: PlatformAuthority.trustHistory)

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
        .navigationTitle("Trust history")
        .task { await model.load() }
    }

    @ViewBuilder
    private var content: some View {
        switch model.state {
        case .loaded(let signals):
            loadedContent(signals)
        default:
            model.state.failClosedContent(
                loadingLabel: "Loading your private signals…",
                unavailableTitle: "Trust history unavailable",
                fabricationNote: "No participant trust data is fabricated when the server or session is unavailable."
            )
        }
    }

    private func loadedContent(_ signals: MyTrustSignals) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            ParticipantFactRow(
                title: "Account age",
                value: signals.accountAgeDays == 0
                    ? "Created today"
                    : "\(signals.accountAgeDays) day\(signals.accountAgeDays == 1 ? "" : "s")"
            )
            ParticipantFactRow(title: "Profile complete", value: signals.profileComplete ? "Yes" : "Not yet")
            ParticipantFactRow(title: "Adult confirmation", value: signals.adultEligible ? "Recorded" : "Not recorded")
            ParticipantFactRow(title: "Completed sessions", value: "\(signals.completedSessions)")
            ParticipantFactRow(title: "Soft Signal endings", value: "\(signals.softSignaledSessions)")
            ParticipantFactRow(title: "Safety endings", value: "\(signals.safetyEndedSessions)")

            Text("Counts never prove someone is safe. Positive history never overrides a current Consent Snapshot.")
                .font(.callout)
                .foregroundStyle(.secondary)
                .padding(.top, 4)
        }
    }
}
