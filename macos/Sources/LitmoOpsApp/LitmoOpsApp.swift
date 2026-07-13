import SwiftUI
import LitmoMacCore

@main
struct LitmoOpsApp: App {
    var body: some Scene {
        WindowGroup {
            OpsRootView().frame(minWidth: 860, minHeight: 600)
        }
    }
}

private struct OpsRootView: View {
    private let capabilities = [
        ("Review queue", "tray.full"), ("Invitations", "envelope.badge"),
        ("Matching pause", "pause.circle"), ("Restrictions and appeals", "shield.lefthalf.filled")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Label("Litmo Ops", systemImage: "lock.shield.fill").font(.largeTitle.bold())
            GroupBox {
                VStack(alignment: .leading, spacing: 10) {
                    Label("Staff access not configured", systemImage: "exclamationmark.lock")
                        .font(.title2.bold())
                    Text("This separate app fails closed. No staff data is loaded and no operational action is available until server-backed staff authentication and authorization are implemented.")
                        .foregroundStyle(.secondary)
                    Text(PlatformAuthority.server).font(.callout.weight(.medium))
                }
                .frame(maxWidth: .infinity, alignment: .leading).padding(12)
            }
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 260), spacing: 16)], spacing: 16) {
                ForEach(capabilities, id: \.0) { capability in
                    Button(action: {}) {
                        Label(capability.0, systemImage: capability.1)
                            .frame(maxWidth: .infinity, minHeight: 48, alignment: .leading)
                    }
                    .buttonStyle(.bordered).disabled(true)
                }
            }
            Text("Separate bundle identifier • separate entitlement file • no shared app group")
                .font(.footnote).foregroundStyle(.secondary)
            Spacer()
        }
        .padding(32)
    }
}
