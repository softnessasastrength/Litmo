import SwiftUI
import LitmoMacCore

@MainActor
final class OwnProfileViewModel: ObservableObject {
    @Published private(set) var state: OwnProfileLoadState = .idle

    private let client: any OwnProfileClient

    init(client: any OwnProfileClient = SupabaseOwnProfileClient.fromEnvironment()) {
        self.client = client
    }

    func load() async {
        state = .loading
        state = await client.fetchOwnProfile()
    }
}

struct OwnProfileView: View {
    @StateObject private var model: OwnProfileViewModel

    init(model: OwnProfileViewModel = OwnProfileViewModel()) {
        _model = StateObject(wrappedValue: model)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Profile").font(.largeTitle.bold())
                    Text("Read-only view of your saved participant profile.")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }

                ParticipantAuthorityBanner(text: PlatformAuthority.ownProfile)

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
        .navigationTitle("Profile")
        .task { await model.load() }
    }

    @ViewBuilder
    private var content: some View {
        switch model.state {
        case .loaded(let profile):
            loadedContent(profile)
        default:
            model.state.failClosedContent(
                loadingLabel: "Loading your profile…",
                unavailableTitle: "Profile unavailable",
                fabricationNote: "No participant profile is fabricated when the server or session is unavailable."
            )
        }
    }

    private func loadedContent(_ profile: OwnProfile) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            ParticipantFactRow(title: "Display name", value: profile.displayName)
            ParticipantFactRow(
                title: "Pronouns",
                value: profile.pronouns?.isEmpty == false ? profile.pronouns! : "Not set"
            )
            ParticipantFactRow(
                title: "Vibe archetype",
                value: profile.vibeArchetype?.isEmpty == false ? profile.vibeArchetype! : "Not set"
            )
            ParticipantFactRow(
                title: "Onboarding",
                value: profile.isOnboardingComplete ? "Complete" : "Not complete"
            )
            ParticipantFactRow(
                title: "Bio",
                value: profile.bio?.isEmpty == false ? profile.bio! : "Not set"
            )

            Text("Editing profiles, touch language, and consent preferences remain phone-first for now. This Mac view never invents missing fields.")
                .font(.callout)
                .foregroundStyle(.secondary)
                .padding(.top, 4)
        }
    }
}
