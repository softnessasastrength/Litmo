import SwiftUI
import LitmoMacCore

private enum ParticipantDestination: String, CaseIterable, Identifiable {
    case home = "Home"
    case campfire = "Campfire"
    case participant = "Participant"

    var id: Self { self }
    var icon: String {
        switch self {
        case .home: "house"
        case .campfire: "flame"
        case .participant: "person.crop.circle"
        }
    }
}

struct ParticipantRootView: View {
    @State private var selection: ParticipantDestination? = .campfire

    var body: some View {
        NavigationSplitView {
            List(ParticipantDestination.allCases, selection: $selection) { destination in
                Label(destination.rawValue, systemImage: destination.icon).tag(destination)
            }
            .navigationTitle("Litmo")
            .navigationSplitViewColumnWidth(min: 180, ideal: 210)
        } detail: {
            switch selection ?? .campfire {
            case .home: HomeView()
            case .campfire: CampfireHubView()
            case .participant: ParticipantWorkspaceView()
            }
        }
    }
}

private struct HomeView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("A calmer place to prepare").font(.largeTitle.bold())
                Text("Use Campfire locally, or review participant information without turning this Mac into an active-session controller.")
                    .font(.title3).foregroundStyle(.secondary)
                authorityCard(title: "Phone-first safety", text: PlatformAuthority.activeSessions, icon: "iphone")
                authorityCard(title: "Server authority", text: PlatformAuthority.server, icon: "lock.shield")
            }
            .padding(32)
            .frame(maxWidth: 780, alignment: .leading)
        }
        .navigationTitle("Home")
    }

    private func authorityCard(title: String, text: String, icon: String) -> some View {
        GroupBox {
            Label {
                VStack(alignment: .leading, spacing: 6) {
                    Text(title).font(.headline)
                    Text(text).foregroundStyle(.secondary)
                }
            } icon: {
                Image(systemName: icon).font(.title2)
            }
            .frame(maxWidth: .infinity, alignment: .leading).padding(8)
        }
    }
}

struct ParticipantWorkspaceView: View {
    private let sections = [
        ("Profile", "person.text.rectangle"), ("Learning", "book.closed"),
        ("Requests", "tray"), ("Consent snapshots", "checkmark.shield"),
        ("Trust history", "clock.arrow.circlepath"), ("Export", "square.and.arrow.up")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Participant").font(.largeTitle.bold())
            Text("Read-only foundation").font(.headline).foregroundStyle(.secondary)
            Text("A server connection is not configured in this first slice. No participant or consent data is fabricated, and no mutations are available.")
                .frame(maxWidth: 620, alignment: .leading)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 220), spacing: 16)], spacing: 16) {
                ForEach(sections, id: \.0) { section in
                    GroupBox {
                        Label(section.0, systemImage: section.1)
                            .font(.headline)
                            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                    }
                }
            }
            Text(PlatformAuthority.activeSessions).font(.footnote).foregroundStyle(.secondary)
            Spacer()
        }
        .padding(32)
        .navigationTitle("Participant")
    }
}
