import Foundation
import UIKit

#if DEBUG
enum DemoFixtures {
    private static let formatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static func date(minutesAgo: Double) -> String {
        formatter.string(from: Date().addingTimeInterval(-minutesAgo * 60))
    }

    static let burns: [Burn] = [
        Burn(
            id: "demo-luna", handle: "luna", displayName: "Luna Park", avatar: "LP", avatarUrl: nil,
            tokens: 38_400_000, cost: 230.40, model: "Claude Opus 4.8", imageUrl: "data:image/svg+xml,demo",
            caption: "Shipped the new collaborative canvas today.", createdAt: date(minutesAgo: 7)
        ),
        Burn(
            id: "demo-marcus", handle: "marcus", displayName: "Marcus Chen", avatar: "MC", avatarUrl: nil,
            tokens: 24_900_000, cost: 149.40, model: "GPT-5", imageUrl: "data:image/svg+xml,demo",
            caption: "Rebuilt onboarding before lunch. The agents cooked.", createdAt: date(minutesAgo: 29)
        ),
        Burn(
            id: "demo-aya", handle: "ayacodes", displayName: "Aya Williams", avatar: "AW", avatarUrl: nil,
            tokens: 17_200_000, cost: 103.20, model: "Gemini 3 Pro", imageUrl: "data:image/svg+xml,demo",
            caption: "First pass on a real-time multiplayer prototype.", createdAt: date(minutesAgo: 74)
        ),
        Burn(
            id: "demo-dev", handle: "devon", displayName: "Devon Brooks", avatar: "DB", avatarUrl: nil,
            tokens: 11_800_000, cost: 70.80, model: "Claude Code", imageUrl: "data:image/svg+xml,demo",
            caption: "Deleted 2,000 lines and made everything faster.", createdAt: date(minutesAgo: 190)
        ),
    ]

    static let entries: [RankEntry] = burns.enumerated().map { index, burn in
        RankEntry(
            rank: index + 1, handle: burn.handle, displayName: burn.displayName, avatar: burn.avatar,
            totalTokens: burn.tokens, posts: index == 0 ? 7 : 5 - index, topBurn: burn.tokens,
            imageUrl: burn.imageUrl, model: burn.model, streak: 7 - index,
            lastBurnAt: burn.createdAt
        )
    }

    static let stats = Stats(burned: 1_284_000_000, posts: 184, burners: 42)
    static let me = Me(
        handle: "luna", displayName: "Luna Park", avatarUrl: nil, streak: 7, postedToday: true,
        posts: 19, totalTokens: 286_400_000, bestDayTokens: 44_100_000,
        bestDayDate: formatter.string(from: Date())
    )
    static let profile = UserProfile(
        id: "demo-luna", handle: "luna", displayName: "Luna Park", company: "Daybreak",
        avatarUrl: nil, bio: "Building tools for creative teams, one daily burn at a time.",
        website: "https://example.com", defaultModel: "Claude Opus 4.8", joinCode: "LUNA7",
        streak: 7, postedToday: true, posts: 19, totalTokens: 286_400_000,
        bestBurn: 44_100_000, bestDayTokens: 44_100_000,
        bestDayDate: formatter.string(from: Date()), followers: 328, following: 86,
        rank: 1, burns: burns
    )

    static func usageScreenshot() -> UIImage {
        let size = CGSize(width: 1000, height: 1250)
        return UIGraphicsImageRenderer(size: size).image { context in
            UIColor(red: 0.035, green: 0.035, blue: 0.045, alpha: 1).setFill()
            context.fill(CGRect(origin: .zero, size: size))

            let white = UIColor(white: 0.94, alpha: 1)
            let fog = UIColor(white: 0.52, alpha: 1)
            let title = "TOKEN USAGE · TODAY"
            title.draw(
                at: CGPoint(x: 72, y: 76),
                withAttributes: [.font: UIFont.systemFont(ofSize: 26, weight: .semibold), .foregroundColor: fog]
            )
            "38.4M".draw(
                at: CGPoint(x: 66, y: 170),
                withAttributes: [.font: UIFont.systemFont(ofSize: 136, weight: .heavy), .foregroundColor: white]
            )
            "tokens".draw(
                at: CGPoint(x: 76, y: 330),
                withAttributes: [.font: UIFont.systemFont(ofSize: 36, weight: .medium), .foregroundColor: fog]
            )

            let heights: [CGFloat] = [0.32, 0.48, 0.41, 0.63, 0.56, 0.78, 0.72, 0.94]
            let chart = CGRect(x: 74, y: 535, width: 852, height: 500)
            let gap: CGFloat = 20
            let barWidth = (chart.width - gap * CGFloat(heights.count - 1)) / CGFloat(heights.count)
            for (index, height) in heights.enumerated() {
                let rect = CGRect(
                    x: chart.minX + CGFloat(index) * (barWidth + gap),
                    y: chart.maxY - chart.height * height,
                    width: barWidth,
                    height: chart.height * height
                )
                (index == heights.count - 1 ? white : UIColor(white: 0.25, alpha: 1)).setFill()
                UIBezierPath(roundedRect: rect, cornerRadius: 14).fill()
            }

            "Claude Opus 4.8".draw(
                at: CGPoint(x: 74, y: 1110),
                withAttributes: [.font: UIFont.systemFont(ofSize: 28, weight: .semibold), .foregroundColor: white]
            )
        }
    }
}
#endif
