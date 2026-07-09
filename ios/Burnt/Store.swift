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

    var loadingBoard = false
    var loadingFeed = false
    var loadError: String?

    func loadBoard() async {
        loadingBoard = true
        defer { loadingBoard = false }
        do {
            async let e = API.leaderboard(range)
            async let s = API.stats()
            entries = try await e
            stats = try await s
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

    func loadMe() async {
        guard let handle = UserDefaults.standard.string(forKey: "burnt.handle"),
              !handle.isEmpty else { me = nil; return }
        me = try? await API.me(handle)
    }

    func refreshAll() async {
        await loadBoard()
        await loadFeed()
        await loadMe()
    }

    private func friendly(_ error: Error) -> String {
        if (error as? URLError)?.code == .cannotConnectToHost
            || (error as? URLError)?.code == .cannotFindHost {
            return "Can't reach the server. Is it running?"
        }
        return error.localizedDescription
    }
}
