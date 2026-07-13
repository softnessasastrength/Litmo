import SwiftUI

@main
struct LitmoParticipantApp: App {
    var body: some Scene {
        WindowGroup {
            ParticipantRootView()
                .frame(minWidth: 920, minHeight: 640)
        }
        .windowStyle(.titleBar)
    }
}
