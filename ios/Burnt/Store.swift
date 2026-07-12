import SwiftUI
import Observation

@MainActor
@Observable
final class AppModel {
    var range: Timeframe = .day
    var entries: [RankEntry] = []
    var feed: [Burn] = []
    var stats: Stats?
    var me: Me?
    var profile: UserProfile?
    var models: [String] = kModels

    var loadingBoard = false
    var loadingFeed = false
    var loadingAccount = true
    var authBusy = false
    var loadError: String?
    var authNotice: String?

    var isAuthenticated: Bool { profile != nil }

    private var isDemo: Bool {
        #if DEBUG
        ProcessInfo.processInfo.environment["BURNT_DEMO_ACCOUNT"] == "1"
        #else
        false
        #endif
    }

    func bootstrap() async {
        if isDemo {
            loadDemo()
            return
        }
        await loadAccount()
        await loadBoard()
        await loadFeed()
        if let remoteModels = try? await API.models(), !remoteModels.isEmpty {
            models = remoteModels
        }
    }

    func loadBoard() async {
        loadingBoard = true
        defer { loadingBoard = false }
        do {
            async let entryRequest = API.leaderboard(range)
            async let statsRequest = API.stats()
            entries = try await entryRequest
            stats = try await statsRequest
            loadError = nil
        } catch {
            loadError = friendly(error)
        }
    }

    func loadFeed() async {
        loadingFeed = true
        defer { loadingFeed = false }
        do {
            feed = try await API.feed()
            loadError = nil
        } catch {
            loadError = friendly(error)
        }
    }

    func loadAccount() async {
        loadingAccount = true
        defer { loadingAccount = false }
        guard SessionStore.load() != nil else {
            profile = nil
            me = nil
            return
        }

        do {
            profile = try await API.profile()
            me = try await API.me()
            authNotice = nil
        } catch {
            if SessionStore.load() == nil {
                profile = nil
                me = nil
            }
            loadError = friendly(error)
        }
    }

    func signIn(email: String, password: String) async throws {
        authBusy = true
        defer { authBusy = false }
        try await API.signIn(email: email, password: password)
        await loadAccount()
        await loadFeed()
    }

    func signUp(
        email: String,
        password: String,
        handle: String,
        displayName: String,
        company: String
    ) async throws {
        authBusy = true
        defer { authBusy = false }
        let needsConfirmation = try await API.signUp(
            email: email,
            password: password,
            handle: handle,
            displayName: displayName,
            company: company
        )
        if needsConfirmation {
            authNotice = "Check your email to confirm the account, then sign in here."
        } else {
            await loadAccount()
            await loadFeed()
        }
    }

    func saveProfile(_ update: ProfileUpdate) async throws {
        authBusy = true
        defer { authBusy = false }
        profile = try await API.updateProfile(update)
        me = try? await API.me()
    }

    func uploadAvatar(_ data: Data) async throws -> String {
        authBusy = true
        defer { authBusy = false }
        return try await API.uploadAvatar(data)
    }

    func signOut() {
        API.signOut()
        profile = nil
        me = nil
        authNotice = nil
        Task { await loadFeed() }
    }

    func refreshAll() async {
        if isDemo {
            loadDemo()
            return
        }
        await loadBoard()
        await loadFeed()
        await loadAccount()
    }

    private func friendly(_ error: Error) -> String {
        if (error as? URLError)?.code == .cannotConnectToHost
            || (error as? URLError)?.code == .cannotFindHost {
            return "Can’t reach Burnt right now. Check your connection and try again."
        }
        return error.localizedDescription
    }

    private func loadDemo() {
        #if DEBUG
        feed = DemoFixtures.burns
        entries = DemoFixtures.entries
        stats = DemoFixtures.stats
        me = DemoFixtures.me
        profile = DemoFixtures.profile
        loadingBoard = false
        loadingFeed = false
        loadingAccount = false
        loadError = nil
        #endif
    }
}
