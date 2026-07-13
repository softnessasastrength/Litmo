import SwiftUI
import LitmoWatchHaptics

/// Litmo on Apple Watch — soft co-regulation, not notifications.
/// Soft Signal is free, offline-first, never emergency services.
@main
struct LitmoWatchApp: App {
  var body: some Scene {
    WindowGroup {
      WatchRootView()
    }
  }
}

struct WatchRootView: View {
  @State private var lastMessage = "You are free to stop anytime."
  @State private var softSignaled = false
  @State private var sessionId: String? = nil
  private let player = LitmoTapticPlayer()
  private let connectivity = WatchConnectivityHub.shared

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 12) {
        Text("Litmo")
          .font(.headline)
          .accessibilityAddTraits(.isHeader)

        Text("Wrist co-regulation — never a feed.")
          .font(.caption2)
          .foregroundStyle(.secondary)
          .fixedSize(horizontal: false, vertical: true)

        if softSignaled {
          Text("You stopped. You are free.")
            .font(.body)
            .fontWeight(.semibold)
            .accessibilityLabel("Soft Signal complete. You stopped. You are free.")
        }

        // Soft Signal — weight 100, no arming ceremony beyond deliberate press.
        Button {
          fireSoftSignal()
        } label: {
          Text(softSignaled ? "Soft Signal sent" : "Soft Signal")
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .tint(.orange)
        .disabled(softSignaled)
        .accessibilityHint(
          "Ends the session if one is active. No explanation needed. Not emergency services."
        )

        Button("Gentle presence") {
          player.play(lexeme: .presence, intensityScale: 0.4)
          lastMessage = "Local presence only — not peer nearby."
        }
        .accessibilityHint("Local double presence. Does not mean someone is near.")

        Button("Co-regulation pulse") {
          player.play(lexeme: .coRegulationHeartbeat, intensityScale: 0.35)
          lastMessage = "Co-regulation pattern. Not medical monitoring."
        }
        .accessibilityHint("Heartbeat-style co-regulation. Not a medical monitor.")

        Button("Preview check-in") {
          player.play(lexeme: .checkInGentle, intensityScale: 0.3)
          lastMessage = "Optional check-in. Soft Signal still free."
        }

        Text(lastMessage)
          .font(.caption2)
          .foregroundStyle(.secondary)
          .fixedSize(horizontal: false, vertical: true)

        Text("Not emergency services. Haptics never mean peer consent.")
          .font(.caption2)
          .foregroundStyle(.tertiary)
          .fixedSize(horizontal: false, vertical: true)
      }
      .padding()
    }
    .onAppear {
      connectivity.activate()
      connectivity.onSessionId = { id in
        sessionId = id
      }
      connectivity.onSoftSignalKillFromPhone = {
        // Phone already stopped; mirror freedom on wrist.
        Task { @MainActor in
          softSignaled = true
          lastMessage = "Phone Soft Signal mirrored. You are free."
          player.play(lexeme: .softSignal, intensityScale: 0.7)
        }
      }
    }
  }

  private func fireSoftSignal() {
    // Local Taptic first (immediate), then kill command — never reverse.
    player.play(lexeme: .softSignal, intensityScale: 0.85)
    softSignaled = true
    lastMessage = "You stopped. You are free."
    let cmd = LitmoSoftSignalKillCommand(
      watchDeviceId: connectivity.localDeviceId,
      sessionId: sessionId,
      at: ISO8601DateFormatter().string(from: Date())
    )
    connectivity.sendSoftSignalKill(cmd)
  }
}
