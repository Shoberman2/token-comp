import SwiftUI
import UIKit

/// Adaptive palette — mirrors the web app's dark/light theme tokens.
enum Palette {
    static let ink = Color(light: 0xF6F6F7, dark: 0x09090B)
    static let ink2 = Color(light: 0xFFFFFF, dark: 0x0D0D10)
    static let panel = Color(light: 0xFFFFFF, dark: 0x131316)
    static let panel2 = Color(light: 0xEDEDF0, dark: 0x17171B)
    static let ash = Color(light: 0xE6E6EA, dark: 0x1C1C21)
    static let smoke = Color(light: 0xD5D5DB, dark: 0x2A2A31)
    static let fog = Color(light: 0x55555C, dark: 0x8B8B93)
    static let dim = Color(light: 0x8B8B93, dark: 0x5B5B61)
    static let bone = Color(light: 0x101014, dark: 0xFAFAFA)
    static let line = Color(light: 0x09090B, dark: 0xFFFFFF, lightAlpha: 0.12, darkAlpha: 0.10)
}

extension LinearGradient {
    /// Metallic treatment for big numbers — silver in dark mode, gunmetal in light.
    static let silver = LinearGradient(
        colors: [
            Color(light: 0x17171B, dark: 0xFFFFFF),
            Color(light: 0x3F3F47, dark: 0xC9C9D1),
            Color(light: 0x71717A, dark: 0x86868F),
        ],
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

    /// A color that resolves per the system appearance.
    init(light: UInt, dark: UInt, lightAlpha: Double = 1, darkAlpha: Double = 1) {
        self.init(uiColor: UIColor { traits in
            let hex = traits.userInterfaceStyle == .dark ? dark : light
            let alpha = traits.userInterfaceStyle == .dark ? darkAlpha : lightAlpha
            return UIColor(
                red: CGFloat((hex >> 16) & 0xFF) / 255,
                green: CGFloat((hex >> 8) & 0xFF) / 255,
                blue: CGFloat(hex & 0xFF) / 255,
                alpha: alpha
            )
        })
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
