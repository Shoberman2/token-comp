import SwiftUI

struct RootView: View {
    @Environment(AppModel.self) private var model
    @State private var tab: Tab = .feed
    @State private var showPost = false
    @State private var shareBurn: Burn?

    enum Tab { case feed, ranks, profile }

    init() {
        // Debug affordance for screenshots/QA: BURNT_TAB=feed, BURNT_PRESENT=post|share
        let env = ProcessInfo.processInfo.environment
        if env["BURNT_TAB"] == "ranks" { _tab = State(initialValue: .ranks) }
        if env["BURNT_TAB"] == "profile" { _tab = State(initialValue: .profile) }
        if env["BURNT_PRESENT"] == "post" { _showPost = State(initialValue: true) }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            AuroraBackground()

            VStack(spacing: 0) {
                // Top brand bar
                HStack {
                    TokenLogo(size: 24)
                    Spacer()
                    StreakChip(me: model.me)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 10)
                .background(.ultraThinMaterial.opacity(0.6))

                Group {
                    switch tab {
                    case .feed: FeedView()
                    case .ranks: LeaderboardView()
                    case .profile: AccountView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }

            tabBar
        }
        .fullScreenCover(isPresented: $showPost) {
            PostView { burn in
                showPost = false
                Task {
                    tab = .feed
                    await model.refreshAll()
                    try? await Task.sleep(nanoseconds: 350_000_000)
                    shareBurn = burn
                }
            }
        }
        .sheet(item: $shareBurn) { burn in
            SharePreviewSheet(burn: burn)
        }
        .task {
            await model.bootstrap()
            #if DEBUG
            if ProcessInfo.processInfo.environment["BURNT_PRESENT"] == "share" {
                shareBurn = model.feed.first
            }
            #endif
        }
    }

    private var tabBar: some View {
        HStack {
            tabButton(.feed, system: "square.grid.2x2.fill", label: "Feed")
            Spacer()
            tabButton(.ranks, system: "trophy.fill", label: "Ranks")
            Spacer()
            Button {
                if model.isAuthenticated {
                    showPost = true
                } else {
                    tab = .profile
                }
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
            tabButton(.profile, system: "person.crop.circle.fill", label: "Profile")
        }
        .padding(.horizontal, 24)
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
