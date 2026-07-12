import SwiftUI

struct LeaderboardView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                header
                statsStrip
                rangePicker
                if model.entries.isEmpty && model.loadingBoard {
                    ProgressView().tint(Palette.bone).padding(.top, 40)
                } else if model.entries.isEmpty {
                    emptyState
                } else {
                    Podium(top3: Array(model.entries.prefix(3)))
                    VStack(spacing: 8) {
                        ForEach(Array(model.entries.dropFirst(3))) { entry in
                            RankRow(entry: entry, leaderTotal: model.entries.first?.totalTokens ?? 1)
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 130)
        }
        .refreshable { await model.loadBoard() }
    }

    private var header: some View {
        HStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Leaderboard").font(.display(26, .bold)).foregroundStyle(Palette.bone)
                Text("Ranked by verified token usage posts")
                    .font(.subheadline).foregroundStyle(Palette.fog)
            }
            Spacer()
        }
        .padding(.top, 6)
    }

    private var statsStrip: some View {
        HStack(spacing: 0) {
            stat("tokens burned", model.stats?.burned ?? 0)
            divider
            stat("burners", model.stats?.burners ?? 0)
            divider
            stat("burns posted", model.stats?.posts ?? 0)
        }
        .padding(.vertical, 12)
        .glass(radius: 18)
    }

    private func stat(_ label: String, _ value: Int) -> some View {
        VStack(spacing: 2) {
            CountUp(value: value, font: .display(20, .bold))
                .foregroundStyle(LinearGradient.silver)
            Text(label).font(.system(size: 10)).foregroundStyle(Palette.dim)
        }
        .frame(maxWidth: .infinity)
    }

    private var divider: some View {
        Rectangle().fill(Palette.line).frame(width: 1, height: 30)
    }

    private var rangePicker: some View {
        HStack(spacing: 4) {
            ForEach(Timeframe.allCases) { tf in
                let active = model.range == tf
                Button {
                    guard model.range != tf else { return }
                    model.range = tf
                    Task { await model.loadBoard() }
                } label: {
                    Text(tf.label)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(active ? Palette.ink : Palette.fog)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 9)
                        .background { if active { Capsule().fill(Palette.bone) } }
                }
            }
        }
        .padding(4)
        .glass(radius: 999)
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            Text("🫥").font(.system(size: 40))
            Text("Nobody's posted a burn in this window yet.")
                .font(.subheadline).foregroundStyle(Palette.fog)
                .multilineTextAlignment(.center)
        }
        .padding(40).frame(maxWidth: .infinity).glass()
    }
}

private struct Podium: View {
    let top3: [RankEntry]

    var body: some View {
        let ordered = [top3[safe: 1], top3[safe: 0], top3[safe: 2]].compactMap { $0 }
        HStack(alignment: .bottom, spacing: 10) {
            ForEach(ordered) { e in
                ZStack(alignment: .bottomLeading) {
                    BurnImageView(burn: burnStub(e), compact: true)
                        .frame(maxWidth: .infinity)
                        .frame(height: e.rank == 1 ? 240 : (e.rank == 2 ? 208 : 190))
                        .clipped()
                    LinearGradient(colors: [Palette.ink, Palette.ink.opacity(0.7), Palette.ink.opacity(0.1)],
                                   startPoint: .bottom, endPoint: .top)
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 5) {
                            AvatarView(name: e.displayName, source: e.avatar, size: 18)
                            Text(e.displayName).font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(Palette.bone).lineLimit(1)
                        }
                        Text("@\(e.handle)").font(.system(size: 11)).foregroundStyle(Palette.fog).lineLimit(1)
                        CountUp(value: e.totalTokens, font: .display(19, .bold))
                            .foregroundStyle(LinearGradient.silver)
                        StreakBadge(n: e.streak)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    // rank badge
                    RankBadge(rank: e.rank).padding(8)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                }
                .frame(maxWidth: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .strokeBorder(e.rank == 1 ? Color.white.opacity(0.25) : Palette.line, lineWidth: 1)
                )
            }
        }
    }

    private func burnStub(_ e: RankEntry) -> Burn {
        Burn(id: e.handle, handle: e.handle, displayName: e.displayName, avatar: e.avatar, avatarUrl: nil,
             tokens: e.topBurn, cost: nil, model: e.model, imageUrl: e.imageUrl,
             caption: nil, createdAt: e.lastBurnAt)
    }
}

private struct RankBadge: View {
    let rank: Int
    var body: some View {
        Text("\(rank)")
            .font(.display(14, .bold))
            .foregroundStyle(rank == 1 ? Palette.ink : Palette.bone)
            .frame(width: 26, height: 26)
            .background(rank == 1 ? Palette.bone : Palette.ash, in: Circle())
            .overlay(Circle().strokeBorder(Palette.line))
    }
}

private struct RankRow: View {
    let entry: RankEntry
    let leaderTotal: Int

    var body: some View {
        HStack(spacing: 12) {
            Text("\(entry.rank)")
                .font(.display(14, .bold)).foregroundStyle(Palette.dim)
                .frame(width: 20)
            BurnImageView(burn: burnStub(entry), compact: true)
                .frame(width: 40, height: 50)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Palette.line))
            VStack(alignment: .leading, spacing: 1) {
                HStack(spacing: 5) {
                    AvatarView(name: entry.displayName, source: entry.avatar, size: 18)
                    Text(entry.displayName).font(.system(size: 14, weight: .semibold)).foregroundStyle(Palette.bone)
                }
                HStack(spacing: 8) {
                    Text("@\(entry.handle)").font(.system(size: 12)).foregroundStyle(Palette.fog).lineLimit(1)
                    StreakBadge(n: entry.streak)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 1) {
                CountUp(value: entry.totalTokens, font: .display(16, .bold))
                    .foregroundStyle(LinearGradient.silver)
                Text(timeAgo(entry.lastBurnAt)).font(.system(size: 10)).foregroundStyle(Palette.dim)
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(alignment: .leading) {
            GeometryReader { geo in
                Palette.bone.opacity(0.05)
                    .frame(width: geo.size.width * CGFloat(max(0.06, Double(entry.totalTokens) / Double(max(1, leaderTotal)))))
            }
        }
        .glass(radius: 16)
    }

    private func burnStub(_ e: RankEntry) -> Burn {
        Burn(id: e.handle, handle: e.handle, displayName: e.displayName, avatar: e.avatar, avatarUrl: nil,
             tokens: e.topBurn, cost: nil, model: e.model, imageUrl: e.imageUrl,
             caption: nil, createdAt: e.lastBurnAt)
    }
}

extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
