import SwiftUI
import LitmoMacCore

private enum ParticipantDestination: String, CaseIterable, Identifiable {
    case home = "Home"
    case campfire = "Campfire"
    case profile = "Profile"
    case trustHistory = "Trust history"
    case requests = "Requests"
    case export = "Export"
    case participant = "Participant"

    var id: Self { self }
    var icon: String {
        switch self {
        case .home: "house"
        case .campfire: "flame"
        case .profile: "person.text.rectangle"
        case .trustHistory: "clock.arrow.circlepath"
        case .requests: "tray"
        case .export: "square.and.arrow.up"
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
            case .profile: OwnProfileView()
            case .trustHistory: TrustHistoryView()
            case .requests: SessionRequestsView()
            case .export: SelfExportView()
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
    private let readySections = [
        ("Profile", "person.text.rectangle", "Sidebar • owner RLS profile row"),
        ("Trust history", "clock.arrow.circlepath", "Sidebar • my_trust_signals RPC"),
        ("Requests", "tray", "Sidebar • list_incoming / list_outgoing (read-only)"),
        ("Export", "square.and.arrow.up", "Sidebar • export_my_data (self-only)"),
    ]
    private let pendingSections = [
        ("Learning", "book.closed"),
        ("Consent snapshots", "checkmark.shield"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Participant").font(.largeTitle.bold())
            Text("Read-only foundation").font(.headline).foregroundStyle(.secondary)
            Text("Profile, trust history, requests, and self export are server-backed when configured. Remaining sections stay placeholders and never invent account data.")
                .frame(maxWidth: 620, alignment: .leading)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 240), spacing: 16)], spacing: 16) {
                ForEach(readySections, id: \.0) { section in
                    GroupBox {
                        Label {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(section.0).font(.headline)
                                Text(section.2).font(.caption).foregroundStyle(.secondary)
                            }
                        } icon: {
                            Image(systemName: section.1)
                        }
                        .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                    }
                }
            }

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 220), spacing: 16)], spacing: 16) {
                ForEach(pendingSections, id: \.0) { section in
                    GroupBox {
                        Label(section.0, systemImage: section.1)
                            .font(.headline)
                            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                    }
                }
            }
            Text(PlatformAuthority.activeSessions).font(.footnote).foregroundStyle(.secondary)
            Text(PlatformAuthority.ownProfile).font(.footnote).foregroundStyle(.secondary)
            Text(PlatformAuthority.trustHistory).font(.footnote).foregroundStyle(.secondary)
            Text(PlatformAuthority.sessionRequests).font(.footnote).foregroundStyle(.secondary)
            Text(PlatformAuthority.selfExport).font(.footnote).foregroundStyle(.secondary)
            Spacer()
        }
        .padding(32)
        .navigationTitle("Participant")
    }
}
