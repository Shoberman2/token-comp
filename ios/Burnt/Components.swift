import SwiftUI

// MARK: - Logo

struct FlameLogo: View {
    var size: CGFloat = 24
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "flame.fill")
                .font(.system(size: size))
                .foregroundStyle(LinearGradient.silver)
            Text("Burnt")
                .font(.display(size, .bold))
                .foregroundStyle(Palette.bone)
        }
    }
}

// MARK: - Streak / live chip

struct StreakChip: View {
    let me: Me?
    var body: some View {
        if let me, me.streak > 0 {
            HStack(spacing: 5) {
                Image(systemName: "flame.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(me.postedToday ? Palette.bone : Palette.fog)
                Text("\(me.streak) day\(me.streak == 1 ? "" : "s")")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Palette.bone)
            }
            .padding(.horizontal, 12).padding(.vertical, 6)
            .background(Palette.panel, in: Capsule())
            .overlay(Capsule().strokeBorder(Palette.line))
        }
    }
}

struct StreakBadge: View {
    let n: Int
    var body: some View {
        if n > 0 {
            HStack(spacing: 3) {
                Image(systemName: "flame.fill").font(.system(size: 11))
                Text("\(n)").font(.system(size: 12, weight: .semibold)).monospacedDigit()
            }
            .foregroundStyle(Palette.fog)
        }
    }
}

// MARK: - Burn image (handles blob URLs, base64, and SVG-seed fallbacks)

struct BurnImageView: View {
    let burn: Burn
    var compact: Bool = false

    @ViewBuilder private var fallback: some View {
        if compact { MiniUsage() } else { UsageCard(burn: burn) }
    }

    private var resolved: URL? {
        let raw = burn.imageUrl
        if raw.hasPrefix("http") { return URL(string: raw) }
        if raw.hasPrefix("/") { return AppConfig.baseURL.appending(path: String(raw.dropFirst())) }
        return nil
    }

    private var rasterData: Data? {
        let raw = burn.imageUrl
        guard raw.hasPrefix("data:image/"), !raw.contains("svg"),
              let comma = raw.firstIndex(of: ","),
              raw[..<comma].contains("base64") else { return nil }
        return Data(base64Encoded: String(raw[raw.index(after: comma)...]))
    }

    var body: some View {
        Group {
            if let data = rasterData, let ui = UIImage(data: data) {
                Image(uiImage: ui).resizable().scaledToFill()
            } else if let url = resolved {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let img): img.resizable().scaledToFill()
                    case .empty: fallback.overlay(compact ? nil : ProgressView().tint(.white))
                    default: fallback
                    }
                }
            } else {
                fallback   // SVG seed data URIs land here
            }
        }
    }
}

/// Scalable mini bar-chart thumbnail — the compact fallback for seed images.
struct MiniUsage: View {
    private let bars: [CGFloat] = [0.35, 0.5, 0.42, 0.68, 0.85, 0.6, 1.0]
    var body: some View {
        ZStack {
            Palette.ink2
            GeometryReader { geo in
                let h = geo.size.height
                HStack(alignment: .bottom, spacing: max(2, geo.size.width * 0.03)) {
                    ForEach(Array(bars.enumerated()), id: \.offset) { i, f in
                        RoundedRectangle(cornerRadius: 2)
                            .fill(i == bars.count - 1 ? Palette.bone : Palette.smoke)
                            .frame(height: max(3, h * 0.66 * f))
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                .padding(max(6, geo.size.width * 0.12))
            }
        }
    }
}

/// Native black-and-white rendering of a "usage screenshot".
struct UsageCard: View {
    let burn: Burn
    var body: some View {
        ZStack {
            Palette.ink2
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Circle().fill(Palette.bone).frame(width: 10, height: 10)
                    Text(burn.model ?? "Claude").font(.system(size: 15, weight: .semibold)).foregroundStyle(Palette.bone)
                }
                Text("TOKEN USAGE · TODAY").font(.caption2).tracking(2).foregroundStyle(Palette.dim)
                Spacer()
                Text(compact(burn.tokens))
                    .font(.system(size: 64, weight: .heavy, design: .rounded))
                    .foregroundStyle(LinearGradient.silver)
                Text(usd(burn.cost ?? estimateCost(burn.tokens)))
                    .font(.subheadline).foregroundStyle(Palette.fog)
                Spacer()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(22)
        }
    }
}

// MARK: - Count-up number

struct CountUp: View {
    let value: Int
    var font: Font = .display(18, .bold)
    @State private var shown: Double = 0

    var body: some View {
        Text(compact(shown))
            .font(font)
            .monospacedDigit()
            .contentTransition(.numericText())
            .onAppear {
                withAnimation(.easeOut(duration: 1.0)) { shown = Double(value) }
            }
            .onChange(of: value) { _, newValue in
                shown = 0
                withAnimation(.easeOut(duration: 1.0)) { shown = Double(newValue) }
            }
    }
}

// MARK: - Primary (white) button

struct PrimaryButton: ViewModifier {
    var enabled: Bool = true
    func body(content: Content) -> some View {
        content
            .font(.display(16, .bold))
            .foregroundStyle(Palette.ink)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(Palette.bone.opacity(enabled ? 1 : 0.3))
            .clipShape(Capsule())
            .shadow(color: Color.white.opacity(enabled ? 0.25 : 0), radius: 18, y: 8)
    }
}

extension View {
    func primaryButton(enabled: Bool = true) -> some View { modifier(PrimaryButton(enabled: enabled)) }
}
