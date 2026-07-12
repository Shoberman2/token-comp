import Foundation

struct Burn: Codable, Identifiable, Hashable {
    let id: String
    let handle: String
    let displayName: String
    let avatar: String
    let avatarUrl: String?
    let tokens: Int
    let cost: Double?
    let model: String?
    let imageUrl: String
    let caption: String?
    let createdAt: String
}

struct RankEntry: Codable, Identifiable, Hashable {
    var id: String { handle }
    let rank: Int
    let handle: String
    let displayName: String
    let avatar: String
    let totalTokens: Int
    let posts: Int
    let topBurn: Int
    let imageUrl: String
    let model: String?
    let streak: Int
    let lastBurnAt: String
}

struct Me: Codable {
    let handle: String
    let displayName: String?
    let avatarUrl: String?
    let streak: Int
    let postedToday: Bool
    let posts: Int
    let totalTokens: Int
    let bestDayTokens: Int
    let bestDayDate: String?
}

struct UserProfile: Codable, Identifiable {
    let id: String?
    let handle: String
    let displayName: String
    let company: String?
    let avatarUrl: String?
    let bio: String?
    let website: String?
    let defaultModel: String?
    let joinCode: String?
    let streak: Int
    let postedToday: Bool
    let posts: Int
    let totalTokens: Int
    let bestBurn: Int
    let bestDayTokens: Int
    let bestDayDate: String?
    let followers: Int
    let following: Int
    let rank: Int?
    let burns: [Burn]
}

struct Stats: Codable {
    let burned: Int
    let posts: Int
    let burners: Int
}

struct LeaderboardResponse: Codable {
    let range: String
    let entries: [RankEntry]
}

struct FeedResponse: Codable {
    let burns: [Burn]
}

struct ProfileResponse: Codable {
    let profile: UserProfile?
}

struct ModelsResponse: Codable {
    let models: [String]
}

struct AuthSession: Codable, Sendable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: Int?
}

struct AuthResponse: Codable {
    let session: AuthSession?
    let requiresEmailConfirmation: Bool?
}

struct AvatarResponse: Codable {
    let avatarUrl: String
}

enum Timeframe: String, CaseIterable, Identifiable {
    case day, week, month, all
    var id: String { rawValue }
    var label: String {
        switch self {
        case .day: return "Today"
        case .week: return "This Week"
        case .month: return "This Month"
        case .all: return "All-Time"
        }
    }
}

let kModels = [
    "Claude Opus 4.8", "Claude Sonnet 5", "Claude Haiku 4.5", "Claude Code",
    "GPT-5", "GPT-5 mini", "GPT-4.1", "GPT-4o", "o3", "o4-mini",
    "Gemini 3 Pro", "Gemini 3 Flash", "Grok 4", "Llama 4", "DeepSeek V3", "Other",
]

// MARK: - Formatting (mirrors the web app)

func compact(_ n: Int) -> String { compact(Double(n)) }
func compact(_ n: Double) -> String {
    let abs = Swift.abs(n)
    func trim(_ v: Double) -> String {
        let s = String(format: "%.1f", v)
        return s.hasSuffix(".0") ? String(s.dropLast(2)) : s
    }
    if abs >= 1e12 { return trim(n / 1e12) + "T" }
    if abs >= 1e9 { return trim(n / 1e9) + "B" }
    if abs >= 1e6 { return trim(n / 1e6) + "M" }
    if abs >= 1e3 { return trim(n / 1e3) + "K" }
    return String(Int(n.rounded()))
}

func usd(_ n: Double) -> String {
    if n >= 1000 { return "$" + compact(n) }
    let s = String(format: "%.2f", n)
    return "$" + (s.hasSuffix(".00") ? String(s.dropLast(3)) : s)
}

func estimateCost(_ tokens: Int) -> Double { Double(tokens) / 1_000_000 * 6 }

func timeAgo(_ iso: String) -> String {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    let date = f.date(from: iso) ?? ISO8601DateFormatter().date(from: iso)
    guard let date else { return "" }
    let s = max(1, Int(Date().timeIntervalSince(date)))
    if s < 60 { return "\(s)s" }
    let m = s / 60
    if m < 60 { return "\(m)m" }
    let h = m / 60
    if h < 24 { return "\(h)h" }
    let d = h / 24
    if d < 7 { return "\(d)d" }
    let w = d / 7
    if w < 5 { return "\(w)w" }
    return "\(d / 30)mo"
}
