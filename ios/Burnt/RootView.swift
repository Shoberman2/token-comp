import SwiftUI

struct RootView: View {
    @Environment(AppModel.self) private var model
    @State private var tab: Tab = .ranks
    @State private var showPost = false

    enum Tab { case ranks, feed }

    init() {
        // Debug affordance for screenshots/QA: BURNT_TAB=feed, BURNT_PRESENT=post
        let env = ProcessInfo.processInfo.environment
        if env["BURNT_TAB"] == "feed" { _tab = State(initialValue: .feed) }
        if env["BURNT_PRESENT"] == "post" { _showPost = State(initialValue: true) }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            AuroraBackground()

            VStack(spacing: 0) {
                // Top brand bar
                HStack {
                    FlameLogo(size: 24)
                    Spacer()
                    StreakChip(me: model.me)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 10)
                .background(.ultraThinMaterial.opacity(0.6))

                Group {
                    switch tab {
                    case .ranks: LeaderboardView()
                    case .feed: FeedView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }

            tabBar
        }
        .fullScreenCover(isPresented: $showPost) {
            PostView {
                showPost = false
                Task {
                    tab = .feed
                    await model.refreshAll()
                }
            }
        }
        .task { await model.refreshAll() }
    }

    private var tabBar: some View {
        HStack {
            tabButton(.ranks, system: "trophy.fill", label: "Ranks")
            Spacer()
            Button {
                showPost = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(Palette.ink)
                    .frame(width: 62, height: 62)
                    .background(Palette.bone, in: Circle())
                    .shadow(color: Color.white.opacity(0.3), radius: 14, y: 6)
            }
            .offset(y: -18)
            Spacer()
            tabButton(.feed, system: "square.grid.2x2.fill", label: "Feed")
        }
        .padding(.horizontal, 36)
        .padding(.vertical, 10)
        .glass(radius: 999, stroke: true)
        .padding(.horizontal, 26)
        .padding(.bottom, 6)
    }

    private func tabButton(_ target: Tab, system: String, label: String) -> some View {
        Button {
            tab = target
        } label: {
            VStack(spacing: 3) {
                Image(systemName: system).font(.system(size: 20))
                Text(label).font(.system(size: 10, weight: .medium))
            }
            .foregroundStyle(tab == target ? Palette.bone : Palette.dim)
            .frame(width: 60)
        }
    }
}
