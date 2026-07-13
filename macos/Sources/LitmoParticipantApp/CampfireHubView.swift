import SwiftUI
import LitmoMacCore

struct CampfireHubView: View {
    @State private var practice: CampfirePractice = .circle

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Campfire").font(.largeTitle.bold())
                Text("A local practice space — not matching, monitoring, or a consent record.")
                    .foregroundStyle(.secondary)
            }
            Picker("Practice", selection: $practice) {
                ForEach(CampfirePractice.allCases) { Text($0.rawValue).tag($0) }
            }
            .pickerStyle(.segmented)
            .accessibilityLabel("Campfire practice")

            Group {
                switch practice {
                case .circle: CircleCampfireView()
                case .quiet: QuietCampfireView()
                case .digital: DigitalCampfireView()
                }
            }
            .frame(maxWidth: 720, maxHeight: .infinity, alignment: .topLeading)
        }
        .padding(32)
        .navigationTitle("Campfire")
    }
}

private struct CircleCampfireView: View {
    @State private var state = CircleCampfireState()

    var body: some View {
        GroupBox("Circle readiness") {
            VStack(alignment: .leading, spacing: 18) {
                Text("Everyone chooses Ready on this Mac. Anyone may pause immediately; no reason is requested.")
                    .foregroundStyle(.secondary)
                Stepper("People: \(state.participantCount)", value: participantCount, in: 2...8)
                    .disabled(state.isActive)
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 12)], spacing: 12) {
                    ForEach(state.readiness.indices, id: \.self) { index in
                        Button { state.toggleReady(at: index) } label: {
                            Label(
                                state.readiness[index] ? "Person \(index + 1) ready" : "Person \(index + 1) not ready",
                                systemImage: state.readiness[index] ? "checkmark.circle.fill" : "circle"
                            )
                            .frame(maxWidth: .infinity, minHeight: 38)
                        }
                        .buttonStyle(.bordered)
                        .disabled(state.isActive)
                    }
                }
                HStack {
                    Button("Start together") { _ = state.start() }
                        .buttonStyle(.borderedProminent)
                        .disabled(!state.canStart)
                    Button("Pause for everyone", role: .destructive) { state.pause() }
                        .buttonStyle(.bordered)
                        .disabled(!state.isActive)
                }
                Text(state.isActive ? "Circle is active. Pause remains available to anyone." : "Waiting for fresh, unanimous readiness.")
                    .font(.callout.weight(.medium))
            }
            .padding(12)
        }
    }

    private var participantCount: Binding<Int> {
        Binding(get: { state.participantCount }, set: { state.setParticipantCount($0) })
    }
}

private struct QuietCampfireView: View {
    @State private var state = QuietCampfireState()

    var body: some View {
        GroupBox("Quiet practice") {
            VStack(alignment: .leading, spacing: 18) {
                Text("Open-ended quiet time. There is no goal, completion badge, streak, or score.")
                    .foregroundStyle(.secondary)
                TimelineView(.periodic(from: .now, by: 1)) { context in
                    Text(formatDuration(state.elapsed(at: context.date)))
                        .font(.system(size: 48, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                        .accessibilityLabel("Elapsed time")
                }
                HStack {
                    if state.isRunning {
                        Button("Pause") { state.pause() }.buttonStyle(.borderedProminent)
                    } else {
                        Button(state.accumulated > 0 ? "Continue" : "Begin") { state.start() }
                            .buttonStyle(.borderedProminent)
                    }
                    Button("Reset", role: .destructive) { state.reset() }
                        .disabled(state.elapsed() == 0)
                }
            }
            .padding(12)
        }
    }
}

private struct DigitalCampfireView: View {
    @State private var state = TimedCampfireState()

    var body: some View {
        GroupBox("Digital pause") {
            VStack(alignment: .leading, spacing: 18) {
                Text("Choose a short screen break. Ending early is always allowed and carries no penalty.")
                    .foregroundStyle(.secondary)
                Picker("Length", selection: selectedMinutes) {
                    ForEach(TimedCampfireState.allowedMinutes, id: \.self) { minutes in
                        Text("\(minutes) min").tag(minutes)
                    }
                }
                .pickerStyle(.segmented)
                .disabled(state.startedAt != nil)
                TimelineView(.periodic(from: .now, by: 1)) { context in
                    Text(formatDuration(state.remaining(at: context.date)))
                        .font(.system(size: 48, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                        .accessibilityLabel("Time remaining")
                }
                HStack {
                    if state.isRunning {
                        Button("Pause") { state.pause() }.buttonStyle(.borderedProminent)
                    } else if state.isPaused {
                        Button("Continue") { state.resume() }.buttonStyle(.borderedProminent)
                    } else {
                        Button("Begin") { state.start() }.buttonStyle(.borderedProminent)
                    }
                    Button("End", role: .destructive) { state.reset() }
                        .disabled(state.startedAt == nil)
                }
            }
            .padding(12)
        }
    }

    private var selectedMinutes: Binding<Int> {
        Binding(get: { Int(state.duration / 60) }, set: { state.select(minutes: $0) })
    }
}

private func formatDuration(_ interval: TimeInterval) -> String {
    let total = max(0, Int(interval.rounded(.down)))
    return String(format: "%02d:%02d", total / 60, total % 60)
}
