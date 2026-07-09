import SwiftUI

struct FeedView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("The Feed").font(.display(24, .bold)).foregroundStyle(Palette.bone)
                        Text("Everyone's burns, freshest first").font(.subheadline).foregroundStyle(Palette.fog)
                    }
                    Spacer()
                    Image(systemName: "flame.fill").font(.system(size: 20)).foregroundStyle(Palette.fog)
                }
                .padding(.top, 6)

                if model.feed.isEmpty && model.loadingFeed {
                    ProgressView().tint(Palette.bone).padding(.top, 40)
                } else if model.feed.isEmpty {
                    VStack(spacing: 10) {
                        Text("🔥").font(.system(size: 40))
                        Text("No burns yet. Start the fire.").font(.subheadline).foregroundStyle(Palette.fog)
                    }
                    .padding(40).frame(maxWidth: .infinity).glass(stroke: true)
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
                Text(burn.avatar).font(.system(size: 20))
                    .frame(width: 40, height: 40).background(Palette.ink.opacity(0.6), in: Circle())
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
                Color.clear.frame(height: 12)
            }
        }
        .glass(stroke: true)
    }
}
