import Foundation

enum AppConfig {
    /// Override at runtime with the "burnt.baseURL" UserDefaults key.
    static var baseURL: URL {
        if let override = UserDefaults.standard.string(forKey: "burnt.baseURL"),
           let url = URL(string: override) {
            return url
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
    var imageType: String
    var tokens: Int
    var model: String
    var caption: String
    var cost: Double?
}

struct ProfileUpdate: Encodable {
    var handle: String
    var displayName: String
    var company: String
    var avatarUrl: String
    var bio: String
    var website: String
    var defaultModel: String
}

private struct AuthRequest: Encodable {
    var action: String
    var email: String?
    var password: String?
    var handle: String?
    var displayName: String?
    var company: String?
    var joinCode: String?
    var refreshToken: String?
}

private struct APIMessage: Decodable {
    let error: String?
}

enum API {
    private static let session = URLSession(configuration: .default)

    static func leaderboard(_ range: Timeframe) async throws -> [RankEntry] {
        let data = try await get(
            "api/leaderboard",
            queryItems: [URLQueryItem(name: "range", value: range.rawValue)]
        )
        return try decode(LeaderboardResponse.self, from: data).entries
    }

    static func feed() async throws -> [Burn] {
        let data = try await get("api/feed", authorized: SessionStore.load() != nil)
        return try decode(FeedResponse.self, from: data).burns
    }

    static func stats() async throws -> Stats {
        try decode(Stats.self, from: await get("api/stats"))
    }

    static func models() async throws -> [String] {
        try decode(ModelsResponse.self, from: await get("api/models")).models
    }

    static func me() async throws -> Me {
        try decode(Me.self, from: await get("api/me", authorized: true))
    }

    static func profile() async throws -> UserProfile {
        let response = try decode(ProfileResponse.self, from: await get("api/profile", authorized: true))
        guard let profile = response.profile else {
            throw APIError(message: "Your profile is not ready yet.")
        }
        return profile
    }

    static func updateProfile(_ update: ProfileUpdate) async throws -> UserProfile {
        let data = try await sendJSON("api/profile", method: "PATCH", value: update, authorized: true)
        let response = try decode(ProfileResponse.self, from: data)
        guard let profile = response.profile else {
            throw APIError(message: "The server did not return your profile.")
        }
        return profile
    }

    static func signIn(email: String, password: String) async throws {
        let response = try await authenticate(AuthRequest(
            action: "sign-in", email: email, password: password,
            handle: nil, displayName: nil, company: nil, joinCode: nil, refreshToken: nil
        ))
        guard let authSession = response.session else {
            throw APIError(message: "The server did not return a session.")
        }
        try SessionStore.save(authSession)
    }

    static func signUp(
        email: String,
        password: String,
        handle: String,
        displayName: String,
        company: String
    ) async throws -> Bool {
        let response = try await authenticate(AuthRequest(
            action: "sign-up", email: email, password: password,
            handle: handle, displayName: displayName, company: company,
            joinCode: nil, refreshToken: nil
        ))
        if let authSession = response.session {
            try SessionStore.save(authSession)
        }
        return response.requiresEmailConfirmation == true
    }

    static func signOut() {
        SessionStore.clear()
    }

    @discardableResult
    static func post(_ burn: NewBurn) async throws -> Burn {
        let boundary = "Boundary-\(UUID().uuidString)"
        var request = URLRequest(url: url("api/burns"))
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        body.appendFormField("tokens", value: String(burn.tokens), boundary: boundary)
        body.appendFormField("model", value: burn.model, boundary: boundary)
        if !burn.caption.isEmpty {
            body.appendFormField("caption", value: burn.caption, boundary: boundary)
        }
        if let cost = burn.cost {
            body.appendFormField("cost", value: String(cost), boundary: boundary)
        }
        body.appendFile(
            name: "image",
            filename: burn.imageType.contains("png") ? "burn.png" : "burn.jpg",
            mimeType: burn.imageType,
            data: burn.image,
            boundary: boundary
        )
        body.append("--\(boundary)--\r\n")
        request.httpBody = body

        struct Wrapper: Decodable { let burn: Burn }
        return try decode(Wrapper.self, from: await perform(request, authorized: true)) .burn
    }

    static func uploadAvatar(_ image: Data, mimeType: String = "image/jpeg") async throws -> String {
        let boundary = "Boundary-\(UUID().uuidString)"
        var request = URLRequest(url: url("api/avatar"))
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        var body = Data()
        body.appendFile(
            name: "image", filename: "avatar.jpg", mimeType: mimeType,
            data: image, boundary: boundary
        )
        body.append("--\(boundary)--\r\n")
        request.httpBody = body
        return try decode(AvatarResponse.self, from: await perform(request, authorized: true)).avatarUrl
    }

    private static func authenticate(_ value: AuthRequest) async throws -> AuthResponse {
        let data = try await sendJSON("api/auth/mobile", method: "POST", value: value, authorized: false)
        return try decode(AuthResponse.self, from: data)
    }

    private static func refreshSession(_ refreshToken: String) async throws {
        let response = try await authenticate(AuthRequest(
            action: "refresh", email: nil, password: nil, handle: nil,
            displayName: nil, company: nil, joinCode: nil, refreshToken: refreshToken
        ))
        guard let authSession = response.session else {
            throw APIError(message: "Your session has expired. Please sign in again.")
        }
        try SessionStore.save(authSession)
    }

    private static func get(
        _ path: String,
        queryItems: [URLQueryItem] = [],
        authorized: Bool = false
    ) async throws -> Data {
        var components = URLComponents(url: url(path), resolvingAgainstBaseURL: false)!
        if !queryItems.isEmpty { components.queryItems = queryItems }
        return try await perform(URLRequest(url: components.url!), authorized: authorized)
    }

    private static func sendJSON<T: Encodable>(
        _ path: String,
        method: String,
        value: T,
        authorized: Bool
    ) async throws -> Data {
        var request = URLRequest(url: url(path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(value)
        return try await perform(request, authorized: authorized)
    }

    private static func perform(
        _ original: URLRequest,
        authorized: Bool,
        retryAfterRefresh: Bool = true
    ) async throws -> Data {
        var request = original
        let authSession = SessionStore.load()
        if authorized {
            guard let authSession else {
                throw APIError(message: "Sign in to continue.")
            }
            request.setValue("Bearer \(authSession.accessToken)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError(message: "No response from the server.")
        }

        if http.statusCode == 401, authorized, retryAfterRefresh, let refreshToken = authSession?.refreshToken {
            do {
                try await refreshSession(refreshToken)
                return try await perform(original, authorized: true, retryAfterRefresh: false)
            } catch {
                SessionStore.clear()
                throw error
            }
        }

        guard (200..<300).contains(http.statusCode) else {
            let message = (try? JSONDecoder().decode(APIMessage.self, from: data).error)
            throw APIError(message: message ?? "Server error (\(http.statusCode)).")
        }
        return data
    }

    private static func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        do {
            return try JSONDecoder().decode(type, from: data)
        } catch {
            throw APIError(message: "The server returned an unreadable response.")
        }
    }

    private static func url(_ path: String) -> URL {
        AppConfig.baseURL.appending(path: path)
    }
}

private extension Data {
    mutating func append(_ string: String) {
        if let data = string.data(using: .utf8) { append(data) }
    }

    mutating func appendFormField(_ name: String, value: String, boundary: String) {
        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n")
        append("\(value)\r\n")
    }

    mutating func appendFile(
        name: String,
        filename: String,
        mimeType: String,
        data: Data,
        boundary: String
    ) {
        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"\(name)\"; filename=\"\(filename)\"\r\n")
        append("Content-Type: \(mimeType)\r\n\r\n")
        append(data)
        append("\r\n")
    }
}
