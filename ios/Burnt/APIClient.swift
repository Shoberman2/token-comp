import Foundation

enum AppConfig {
    /// Where the app talks to. On the simulator we point at a local dev server
    /// so you can iterate against `npm run dev`; on device we hit production.
    /// Override at runtime via the key "burnt.baseURL" in UserDefaults.
    static var baseURL: URL {
        if let override = UserDefaults.standard.string(forKey: "burnt.baseURL"),
           let u = URL(string: override) {
            return u
        }
        #if targetEnvironment(simulator)
        return URL(string: "http://localhost:3111")!
        #else
        return URL(string: "https://burnt-delta.vercel.app")!
        #endif
    }
}

struct APIError: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

struct NewBurn {
    var image: Data
    var imageType: String            // e.g. "image/jpeg"
    var tokens: Int
    var handle: String
    var displayName: String
    var avatar: String
    var model: String
    var caption: String
    var cost: Double?
}

enum API {
    private static let session = URLSession(configuration: .default)

    static func leaderboard(_ range: Timeframe) async throws -> [RankEntry] {
        let url = AppConfig.baseURL.appending(path: "api/leaderboard")
            .appending(queryItems: [URLQueryItem(name: "range", value: range.rawValue)])
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode(LeaderboardResponse.self, from: data).entries
    }

    static func feed() async throws -> [Burn] {
        let url = AppConfig.baseURL.appending(path: "api/burns")
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode(FeedResponse.self, from: data).burns
    }

    static func stats() async throws -> Stats {
        let url = AppConfig.baseURL.appending(path: "api/stats")
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode(Stats.self, from: data)
    }

    static func me(_ handle: String) async throws -> Me {
        let url = AppConfig.baseURL.appending(path: "api/me")
            .appending(queryItems: [URLQueryItem(name: "handle", value: handle)])
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode(Me.self, from: data)
    }

    @discardableResult
    static func post(_ burn: NewBurn) async throws -> Burn {
        let url = AppConfig.baseURL.appending(path: "api/burns")
        let boundary = "Boundary-\(UUID().uuidString)"
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        func field(_ name: String, _ value: String) {
            body.append("--\(boundary)\r\n")
            body.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n")
            body.append("\(value)\r\n")
        }
        field("tokens", String(burn.tokens))
        field("handle", burn.handle)
        field("displayName", burn.displayName)
        field("avatar", burn.avatar)
        field("model", burn.model)
        if !burn.caption.isEmpty { field("caption", burn.caption) }
        if let cost = burn.cost { field("cost", String(cost)) }

        let ext = burn.imageType.contains("png") ? "png" : "jpg"
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"burn.\(ext)\"\r\n")
        body.append("Content-Type: \(burn.imageType)\r\n\r\n")
        body.append(burn.image)
        body.append("\r\n")
        body.append("--\(boundary)--\r\n")
        req.httpBody = body

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIError(message: "No response from server.")
        }
        if !(200..<300).contains(http.statusCode) {
            let msg = (try? JSONDecoder().decode([String: String].self, from: data))?["error"]
            throw APIError(message: msg ?? "Server error (\(http.statusCode)).")
        }
        struct Wrapper: Codable { let burn: Burn }
        return try JSONDecoder().decode(Wrapper.self, from: data).burn
    }
}

private extension Data {
    mutating func append(_ string: String) {
        if let d = string.data(using: .utf8) { append(d) }
    }
}
