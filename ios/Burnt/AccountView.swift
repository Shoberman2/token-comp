import SwiftUI
import PhotosUI

struct AccountView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        ScrollView {
            Group {
                if model.loadingAccount {
                    ProgressView().tint(Palette.bone).padding(.top, 80)
                } else if let profile = model.profile {
                    AccountEditor(profile: profile)
                } else if SessionStore.load() != nil {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Couldn’t load your account")
                            .font(.display(24, .bold)).foregroundStyle(Palette.bone)
                        Text(model.loadError ?? "Check your connection and try again.")
                            .font(.subheadline).foregroundStyle(Palette.fog)
                        Button { Task { await model.loadAccount() } } label: {
                            Text("Try again").primaryButton()
                        }
                    }
                    .padding(16).glass(radius: 20)
                } else {
                    AuthView()
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 130)
        }
    }
}

private struct AuthView: View {
    @Environment(AppModel.self) private var model
    @State private var signingUp = true
    @State private var email = ""
    @State private var password = ""
    @State private var handle = ""
    @State private var displayName = ""
    @State private var company = ""
    @State private var error: String?

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespaces).isEmpty
            && password.count >= 6
            && (!signingUp || handle.count >= 3)
            && !model.authBusy
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 4) {
                Text(signingUp ? "Create your account" : "Welcome back")
                    .font(.display(28, .bold)).foregroundStyle(Palette.bone)
                Text("One account keeps your profile, streak, and burns in sync with the web.")
                    .font(.subheadline).foregroundStyle(Palette.fog)
            }

            VStack(spacing: 12) {
                field("Email") {
                    TextField("you@example.com", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                }
                field("Password") {
                    SecureField("At least 6 characters", text: $password)
                        .textContentType(signingUp ? .newPassword : .password)
                }

                if signingUp {
                    field("Handle") {
                        HStack(spacing: 2) {
                            Text("@").foregroundStyle(Palette.fog)
                            TextField("your_handle", text: $handle)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .onChange(of: handle) { _, value in
                                    handle = value.lowercased()
                                        .filter { $0.isLetter || $0.isNumber || $0 == "_" }
                                        .prefix(24).description
                                }
                        }
                    }
                    field("Display name") {
                        TextField("Your name", text: $displayName).textContentType(.name)
                    }
                    field("Company") {
                        TextField("Optional", text: $company).textContentType(.organizationName)
                    }
                }

                if let notice = model.authNotice {
                    message(notice)
                }
                if let error { message(error) }

                Button { Task { await submit() } } label: {
                    HStack(spacing: 8) {
                        if model.authBusy { ProgressView().tint(Palette.ink) }
                        Text(signingUp ? "Create account" : "Sign in")
                    }
                    .primaryButton(enabled: canSubmit)
                }
                .disabled(!canSubmit)
            }
            .padding(16)
            .glass(radius: 20)

            Button {
                signingUp.toggle()
                error = nil
                model.authNotice = nil
            } label: {
                Text(signingUp ? "Already have an account? Sign in" : "New to Burnt? Create an account")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Palette.bone)
                    .underline()
            }

            Link("Forgot your password? Reset it on the web", destination: AppConfig.baseURL.appending(path: "login"))
                .font(.system(size: 13)).foregroundStyle(Palette.fog).underline()
        }
    }

    private func field<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label.uppercased()).font(.caption).tracking(1).foregroundStyle(Palette.dim)
            content()
                .font(.system(size: 15))
                .foregroundStyle(Palette.bone)
                .padding(.horizontal, 13).padding(.vertical, 12)
                .background(Palette.ink.opacity(0.7), in: RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Palette.line))
        }
    }

    private func message(_ text: String) -> some View {
        Text(text)
            .font(.subheadline).foregroundStyle(Palette.bone)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12).background(Color.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
    }

    private func submit() async {
        error = nil
        do {
            if signingUp {
                try await model.signUp(
                    email: email.trimmingCharacters(in: .whitespaces),
                    password: password,
                    handle: handle,
                    displayName: displayName.trimmingCharacters(in: .whitespaces),
                    company: company.trimmingCharacters(in: .whitespaces)
                )
            } else {
                try await model.signIn(
                    email: email.trimmingCharacters(in: .whitespaces),
                    password: password
                )
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

private struct AccountEditor: View {
    let profile: UserProfile
    @Environment(AppModel.self) private var model
    @State private var handle = ""
    @State private var displayName = ""
    @State private var company = ""
    @State private var bio = ""
    @State private var website = ""
    @State private var avatarUrl = ""
    @State private var defaultModel = "Other"
    @State private var photoItem: PhotosPickerItem?
    @AppStorage("burnt.appearance") private var appearance = "system"
    @State private var error: String?
    @State private var saved = false

    private var publicURL: URL {
        AppConfig.baseURL.appending(path: "u/\(handle.isEmpty ? profile.handle : handle)")
    }

    var body: some View {
        VStack(spacing: 18) {
            HStack(spacing: 14) {
                PhotosPicker(selection: $photoItem, matching: .images) {
                    ZStack(alignment: .bottomTrailing) {
                        AvatarView(name: displayName, source: avatarUrl, size: 82)
                        Image(systemName: "camera.fill")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(Palette.ink)
                            .frame(width: 30, height: 30)
                            .background(Palette.bone, in: Circle())
                    }
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(displayName.isEmpty ? profile.displayName : displayName)
                        .font(.display(24, .bold)).foregroundStyle(Palette.bone)
                    Text("@\(handle.isEmpty ? profile.handle : handle)")
                        .font(.subheadline).foregroundStyle(Palette.fog)
                    if let rank = profile.rank {
                        Label("#\(rank) all-time", systemImage: "trophy.fill")
                            .font(.caption).foregroundStyle(Palette.fog).padding(.top, 3)
                    }
                }
                Spacer()
            }

            HStack(spacing: 0) {
                stat("burned", profile.totalTokens)
                divider
                stat("burns", profile.posts)
                divider
                stat("best day", profile.bestDayTokens)
                divider
                stat("streak", profile.streak)
            }
            .padding(.vertical, 13).glass(radius: 18)

            VStack(spacing: 12) {
                editField("Handle") {
                    HStack(spacing: 2) {
                        Text("@").foregroundStyle(Palette.fog)
                        TextField("handle", text: $handle)
                            .textInputAutocapitalization(.never).autocorrectionDisabled()
                            .onChange(of: handle) { _, value in
                                handle = value.lowercased()
                                    .filter { $0.isLetter || $0.isNumber || $0 == "_" }
                                    .prefix(24).description
                            }
                    }
                }
                editField("Display name") { TextField("Name", text: $displayName) }
                editField("Company") { TextField("Company", text: $company) }
                editField("Website") {
                    TextField("https://example.com", text: $website)
                        .textInputAutocapitalization(.never).keyboardType(.URL)
                }
                editField("Bio") {
                    TextField("What are you building?", text: $bio, axis: .vertical).lineLimit(2...4)
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("DEFAULT MODEL").font(.caption).tracking(1).foregroundStyle(Palette.dim)
                    Picker("Default model", selection: $defaultModel) {
                        ForEach(model.models, id: \.self) { Text($0).tag($0) }
                    }
                    .pickerStyle(.menu).tint(Palette.bone)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 13).padding(.vertical, 8)
                    .background(Palette.ink.opacity(0.7), in: RoundedRectangle(cornerRadius: 12))
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("APPEARANCE").font(.caption).tracking(1).foregroundStyle(Palette.dim)
                    Picker("Appearance", selection: $appearance) {
                        Text("System").tag("system")
                        Text("Dark").tag("dark")
                        Text("Light").tag("light")
                    }
                    .pickerStyle(.segmented)
                }

                if let error { banner(error) }
                if saved { banner("Profile saved.") }

                Button { Task { await save() } } label: {
                    HStack(spacing: 8) {
                        if model.authBusy { ProgressView().tint(Palette.ink) }
                        Image(systemName: "checkmark")
                        Text("Save profile")
                    }
                    .primaryButton(enabled: handle.count >= 3 && !displayName.isEmpty && !model.authBusy)
                }
                .disabled(handle.count < 3 || displayName.isEmpty || model.authBusy)
            }
            .padding(16).glass(radius: 20)

            HStack(spacing: 12) {
                ShareLink(item: publicURL) {
                    Label("Share profile", systemImage: "square.and.arrow.up")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Palette.bone)
                        .frame(maxWidth: .infinity).padding(.vertical, 12)
                        .background(Palette.panel, in: RoundedRectangle(cornerRadius: 12))
                        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Palette.line))
                }
                Button { model.signOut() } label: {
                    Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Palette.fog)
                        .frame(maxWidth: .infinity).padding(.vertical, 12)
                        .background(Palette.panel, in: RoundedRectangle(cornerRadius: 12))
                        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Palette.line))
                }
            }

            if !profile.burns.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("YOUR BURNS").font(.caption).tracking(1).foregroundStyle(Palette.dim)
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                        ForEach(profile.burns) { burn in
                            ZStack(alignment: .bottomLeading) {
                                BurnImageView(burn: burn, compact: true)
                                    .aspectRatio(1, contentMode: .fill).clipped()
                                Text(compact(burn.tokens))
                                    .font(.display(13, .bold)).foregroundStyle(LinearGradient.silver)
                                    .padding(7)
                            }
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }
            }
        }
        .task(id: profile.handle) { load(profile) }
        .onChange(of: photoItem) { _, item in
            guard let item else { return }
            Task { await upload(item) }
        }
    }

    private var divider: some View { Rectangle().fill(Palette.line).frame(width: 1, height: 30) }

    private func stat(_ label: String, _ value: Int) -> some View {
        VStack(spacing: 2) {
            Text(compact(value)).font(.display(18, .bold)).foregroundStyle(LinearGradient.silver)
            Text(label).font(.system(size: 9)).foregroundStyle(Palette.dim)
        }.frame(maxWidth: .infinity)
    }

    private func editField<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label.uppercased()).font(.caption).tracking(1).foregroundStyle(Palette.dim)
            content()
                .font(.system(size: 15)).foregroundStyle(Palette.bone)
                .padding(.horizontal, 13).padding(.vertical, 12)
                .background(Palette.ink.opacity(0.7), in: RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Palette.line))
        }
    }

    private func banner(_ text: String) -> some View {
        Text(text).font(.subheadline).foregroundStyle(Palette.bone)
            .frame(maxWidth: .infinity, alignment: .leading).padding(12)
            .background(Color.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
    }

    private func load(_ profile: UserProfile) {
        handle = profile.handle
        displayName = profile.displayName
        company = profile.company ?? ""
        bio = profile.bio ?? ""
        website = profile.website ?? ""
        avatarUrl = profile.avatarUrl ?? ""
        defaultModel = profile.defaultModel ?? model.models.first ?? "Other"
    }

    private func upload(_ item: PhotosPickerItem) async {
        error = nil
        do {
            guard let data = try await item.loadTransferable(type: Data.self),
                  let image = UIImage(data: data),
                  let jpeg = image.jpegData(compressionQuality: 0.86) else {
                throw APIError(message: "Could not read that image.")
            }
            avatarUrl = try await model.uploadAvatar(jpeg)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func save() async {
        saved = false
        error = nil
        do {
            try await model.saveProfile(ProfileUpdate(
                handle: handle, displayName: displayName, company: company,
                avatarUrl: avatarUrl, bio: bio, website: website, defaultModel: defaultModel
            ))
            saved = true
        } catch {
            self.error = error.localizedDescription
        }
    }
}
