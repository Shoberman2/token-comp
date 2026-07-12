import SwiftUI

@main
struct BurntApp: App {
    @State private var model = AppModel()
    @AppStorage("burnt.appearance") private var appearance = "system"

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .preferredColorScheme(
                    appearance == "dark" ? .dark : appearance == "light" ? .light : nil
                )
                .tint(Palette.bone)
        }
    }
}
