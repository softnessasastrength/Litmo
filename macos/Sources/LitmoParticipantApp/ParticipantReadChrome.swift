import SwiftUI
import LitmoMacCore

/// Shared fail-closed chrome for server-backed participant reads.
struct ParticipantFailClosedCard: View {
    let title: String
    let message: String
    let systemImage: String
    let fabricationNote: String

    var body: some View {
        GroupBox {
            VStack(alignment: .leading, spacing: 10) {
                Label(title, systemImage: systemImage)
                    .font(.title2.bold())
                Text(message)
                    .foregroundStyle(.secondary)
                Text(fabricationNote)
                    .font(.callout)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
        }
    }
}

struct ParticipantAuthorityBanner: View {
    let text: String

    var body: some View {
        GroupBox {
            Label {
                Text(text).foregroundStyle(.secondary)
            } icon: {
                Image(systemName: "lock.shield")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(8)
        }
    }
}

struct ParticipantFactRow: View {
    let title: String
    let value: String

    var body: some View {
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

extension ParticipantReadOutcome {
    @ViewBuilder
    func failClosedContent(
        loadingLabel: String,
        unavailableTitle: String,
        fabricationNote: String
    ) -> some View {
        switch self {
        case .idle, .loading:
            ProgressView(loadingLabel)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 24)
        case .missingConfiguration(let message):
            ParticipantFailClosedCard(
                title: "Server not configured",
                message: message,
                systemImage: "gearshape",
                fabricationNote: fabricationNote
            )
        case .unauthenticated(let message):
            ParticipantFailClosedCard(
                title: "Session not connected",
                message: message,
                systemImage: "person.crop.circle.badge.exclamationmark",
                fabricationNote: fabricationNote
            )
        case .unavailable(let message):
            ParticipantFailClosedCard(
                title: unavailableTitle,
                message: message,
                systemImage: "exclamationmark.triangle",
                fabricationNote: fabricationNote
            )
        case .loaded:
            EmptyView()
        }
    }
}
