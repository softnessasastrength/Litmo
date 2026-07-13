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

                authorityBanner

                content
                    .frame(maxWidth: 720, alignment: .leading)

                Button("Refresh") {
                    Task { await model.load() }
                }
                .disabled(model.state == .loading)
                .keyboardShortcut("r", modifiers: [.command])
            }
            .padding(32)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .navigationTitle("Trust history")
        .task { await model.load() }
    }

    private var authorityBanner: some View {
        GroupBox {
            Label {
                Text(PlatformAuthority.trustHistory)
                    .foregroundStyle(.secondary)
            } icon: {
                Image(systemName: "lock.shield")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(8)
        }
    }

    @ViewBuilder
    private var content: some View {
        switch model.state {
        case .idle, .loading:
            ProgressView("Loading your private signals…")
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 24)
        case .missingConfiguration(let message):
            failClosedCard(title: "Server not configured", message: message, systemImage: "gearshape")
        case .unauthenticated(let message):
            failClosedCard(title: "Session not connected", message: message, systemImage: "person.crop.circle.badge.exclamationmark")
        case .unavailable(let message):
            failClosedCard(title: "Trust history unavailable", message: message, systemImage: "exclamationmark.triangle")
        case .loaded(let signals):
            loadedContent(signals)
        }
    }

    private func failClosedCard(title: String, message: String, systemImage: String) -> some View {
        GroupBox {
            VStack(alignment: .leading, spacing: 10) {
                Label(title, systemImage: systemImage)
                    .font(.title2.bold())
                Text(message)
                    .foregroundStyle(.secondary)
                Text("No participant trust data is fabricated when the server or session is unavailable.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
        }
    }

    private func loadedContent(_ signals: MyTrustSignals) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            factRow(
                title: "Account age",
                value: signals.accountAgeDays == 0
                    ? "Created today"
                    : "\(signals.accountAgeDays) day\(signals.accountAgeDays == 1 ? "" : "s")"
            )
            factRow(title: "Profile complete", value: signals.profileComplete ? "Yes" : "Not yet")
            factRow(title: "Adult confirmation", value: signals.adultEligible ? "Recorded" : "Not recorded")
            factRow(title: "Completed sessions", value: "\(signals.completedSessions)")
            factRow(title: "Soft Signal endings", value: "\(signals.softSignaledSessions)")
            factRow(title: "Safety endings", value: "\(signals.safetyEndedSessions)")

            Text("Counts never prove someone is safe. Positive history never overrides a current Consent Snapshot.")
                .font(.callout)
                .foregroundStyle(.secondary)
                .padding(.top, 4)
        }
    }

    private func factRow(title: String, value: String) -> some View {
        GroupBox {
            VStack(alignment: .leading, spacing: 4) {
                Text(title.uppercased())
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.title2.weight(.semibold))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(8)
        }
    }
}
