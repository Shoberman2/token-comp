import SwiftUI

struct FeedView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Feed").font(.display(26, .bold)).foregroundStyle(Palette.bone)
                        Text("Burns from people you follow").font(.subheadline).foregroundStyle(Palette.fog)
                    }
                    Spacer()
                }
                .padding(.top, 6)

                if model.feed.isEmpty && model.loadingFeed {
                    ProgressView().tint(Palette.bone).padding(.top, 40)
                } else if model.feed.isEmpty {
                    VStack(spacing: 12) {
                        TokenMark(size: 40).opacity(0.7)
                        VStack(spacing: 3) {
                            Text("No burns yet").font(.display(17, .bold)).foregroundStyle(Palette.bone)
                            Text("Be the first to post today's usage.")
                                .font(.subheadline).foregroundStyle(Palette.fog)
                        }
                    }
                    .padding(.vertical, 48).padding(.horizontal, 24)
                    .frame(maxWidth: .infinity).glass(stroke: true)
                } else {
                    ForEach(model.feed) { burn in
                        BurnCardView(burn: burn)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 130)
        }
        .refreshable { await model.loadFeed() }
    }
}

struct BurnCardView: View {
    let burn: Burn

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                AvatarView(
                    name: burn.displayName,
                    source: burn.avatarUrl ?? burn.avatar,
                    size: 40
                )
                VStack(alignment: .leading, spacing: 1) {
                    Text(burn.displayName).font(.system(size: 14, weight: .semibold)).foregroundStyle(Palette.bone)
                    Text("@\(burn.handle)").font(.system(size: 12)).foregroundStyle(Palette.fog)
                }
                Spacer()
                Text(timeAgo(burn.createdAt)).font(.system(size: 12)).foregroundStyle(Palette.fog)
            }
            .padding(.horizontal, 14).padding(.vertical, 12)

            ZStack(alignment: .bottom) {
                BurnImageView(burn: burn)
                    .frame(maxWidth: .infinity)
                    .aspectRatio(4.0/5.0, contentMode: .fill)
                    .clipped()

                LinearGradient(colors: [.black.opacity(0.85), .clear], startPoint: .bottom, endPoint: .top)
                    .frame(height: 150)
                    .frame(maxHeight: .infinity, alignment: .bottom)
                    .allowsHitTesting(false)

                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(compact(burn.tokens))
                            .font(.system(size: 34, weight: .heavy, design: .rounded))
                            .foregroundStyle(LinearGradient.silver)
                        Text("tokens · \(usd(burn.cost ?? estimateCost(burn.tokens)))")
                            .font(.system(size: 12)).foregroundStyle(.white.opacity(0.6))
                    }
                    Spacer()
                    if let m = burn.model {
                        Text(m).font(.system(size: 11, weight: .medium)).foregroundStyle(Palette.bone)
                            .padding(.horizontal, 10).padding(.vertical, 5)
                            .glass(radius: 999)
                    }
                }
                .padding(16)
            }
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .padding(.horizontal, 12)

            if let caption = burn.caption, !caption.isEmpty {
                HStack(alignment: .top, spacing: 4) {
                    Text("@\(burn.handle)").font(.system(size: 14, weight: .semibold)).foregroundStyle(Palette.bone)
                    Text(caption).font(.system(size: 14)).foregroundStyle(Palette.bone.opacity(0.85))
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 16).padding(.vertical, 12)
            } else {
                Color.clear.frame(height: 6)
            }

            HStack {
                Label("Daily burn", systemImage: "sun.max.fill")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Palette.fog)
                Spacer()
                ShareLink(
                    item: AppConfig.baseURL.appending(path: "b/\(burn.id)"),
                    subject: Text("\(burn.displayName)'s daily burn"),
                    message: Text("@\(burn.handle) burned \(compact(burn.tokens)) AI tokens today.")
                ) {
                    Label("Share", systemImage: "square.and.arrow.up")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Palette.bone)
                        .padding(.horizontal, 12).padding(.vertical, 8)
                        .background(Palette.panel, in: Capsule())
                        .overlay(Capsule().strokeBorder(Palette.line))
                }
            }
            .padding(.horizontal, 16).padding(.vertical, 10)
            .overlay(alignment: .top) { Rectangle().fill(Palette.line).frame(height: 1) }
        }
        .glass(stroke: true)
    }
}

struct SharePreviewSheet: View {
    let burn: Burn
    @Environment(\.dismiss) private var dismiss

    private var publicURL: URL {
        AppConfig.baseURL.appending(path: "b/\(burn.id)")
    }

    var body: some View {
        ZStack {
            AuroraBackground()
            ScrollView {
                VStack(spacing: 18) {
                    HStack {
                        TokenLogo(size: 21)
                        Spacer()
                        Button { dismiss() } label: {
                            Image(systemName: "xmark")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(Palette.bone)
                                .frame(width: 34, height: 34)
                                .background(Palette.ash, in: Circle())
                        }
                    }

                    VStack(spacing: 5) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 30)).foregroundStyle(Palette.bone)
                        Text("Your daily burn is live")
                            .font(.display(27, .bold)).foregroundStyle(Palette.bone)
                        Text("Share what you shipped. Pull your friends in.")
                            .font(.subheadline).foregroundStyle(Palette.fog)
                    }
                    .multilineTextAlignment(.center)

                    VStack(spacing: 0) {
                        HStack(spacing: 10) {
                            AvatarView(name: burn.displayName, source: burn.avatarUrl ?? burn.avatar, size: 38)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(burn.displayName).font(.system(size: 14, weight: .semibold))
                                Text("@\(burn.handle) · today").font(.caption).foregroundStyle(Palette.fog)
                            }
                            Spacer()
                        }
                        .padding(14)

                        ZStack(alignment: .bottomLeading) {
                            BurnImageView(burn: burn)
                                .aspectRatio(4.0 / 5.0, contentMode: .fill)
                                .frame(maxWidth: .infinity)
                                .clipped()
                            LinearGradient(
                                colors: [.black.opacity(0.88), .clear],
                                startPoint: .bottom,
                                endPoint: .top
                            )
                            .frame(height: 160).frame(maxHeight: .infinity, alignment: .bottom)
                            Text("\(compact(burn.tokens)) tokens")
                                .font(.system(size: 34, weight: .heavy, design: .rounded))
                                .foregroundStyle(LinearGradient.silver)
                                .padding(16)
                        }
                    }
                    .glass(radius: 22, stroke: true)

                    ShareLink(
                        item: publicURL,
                        subject: Text("\(burn.displayName)'s daily burn"),
                        message: Text("@\(burn.handle) burned \(compact(burn.tokens)) AI tokens today.")
                    ) {
                        Label("Share with friends", systemImage: "square.and.arrow.up")
                            .primaryButton()
                    }

                    Link(destination: publicURL) {
                        Label("Open public post", systemImage: "safari")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Palette.fog)
                    }
                }
                .padding(18)
                .padding(.bottom, 24)
            }
        }
        .presentationDragIndicator(.visible)
    }
}
