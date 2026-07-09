import SwiftUI

enum Palette {
    static let ink = Color(hex: 0x09090B)
    static let ink2 = Color(hex: 0x0D0D10)
    static let panel = Color(hex: 0x131316)
    static let panel2 = Color(hex: 0x17171B)
    static let ash = Color(hex: 0x1C1C21)
    static let smoke = Color(hex: 0x2A2A31)
    static let fog = Color(hex: 0x8B8B93)
    static let dim = Color(hex: 0x5B5B61)
    static let bone = Color(hex: 0xFAFAFA)
    static let line = Color.white.opacity(0.10)
}

extension LinearGradient {
    /// Metallic white->gray used for big numbers.
    static let silver = LinearGradient(
        colors: [Color(hex: 0xFFFFFF), Color(hex: 0xC9C9D1), Color(hex: 0x86868F)],
        startPoint: .top, endPoint: .bottom
    )
}

extension Color {
    init(hex: UInt, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }
}

/// Minimal ambient light background.
struct AuroraBackground: View {
    var body: some View {
        ZStack {
            Palette.ink
            RadialGradient(colors: [Color.white.opacity(0.06), .clear],
                           center: .top, startRadius: 0, endRadius: 460)
        }
        .ignoresSafeArea()
    }
}

/// Flat panel surface matching the web `.glass`.
struct GlassCard: ViewModifier {
    var radius: CGFloat = 20
    var stroke: Bool = false
    func body(content: Content) -> some View {
        content
            .background(Palette.panel)
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .strokeBorder(Palette.line, lineWidth: 1)
            )
            .overlay(
                stroke
                    ? RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
                        .blur(radius: 0.5)
                    : nil
            )
            .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
    }
}

extension View {
    func glass(radius: CGFloat = 20, stroke: Bool = false) -> some View {
        modifier(GlassCard(radius: radius, stroke: stroke))
    }

    /// Fills text (or any shape) with the silver gradient.
    func silverFill() -> some View {
        self.overlay(LinearGradient.silver).mask(self)
    }
}

extension Font {
    static func display(_ size: CGFloat, _ weight: Font.Weight = .bold) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }
}
