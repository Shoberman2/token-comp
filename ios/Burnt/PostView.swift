import SwiftUI
import PhotosUI

struct PostView: View {
    var onDone: (Burn) -> Void
    @Environment(\.dismiss) private var dismiss
    @Environment(AppModel.self) private var appModel

    @State private var preview: UIImage?
    @State private var imageData: Data?
    @State private var tokensText = ""
    @State private var selectedModel = "Claude Opus 4.8"
    @State private var caption = ""

    @State private var showSourceDialog = false
    @State private var showCamera = false
    @State private var showLibrary = false
    @State private var photoItem: PhotosPickerItem?

    @State private var submitting = false
    @State private var error: String?

    private var tokens: Int { Int(tokensText.filter(\.isNumber)) ?? 0 }
    private var canSubmit: Bool {
        imageData != nil && tokens > 0 && appModel.isAuthenticated && !submitting
    }

    var body: some View {
        ZStack {
            AuroraBackground()
            VStack(spacing: 0) {
                topBar
                ScrollView {
                    VStack(spacing: 18) {
                        capture
                        tokensField
                        modelField
                        captionField
                        if let error { errorBanner(error) }
                        submitButton
                        streakNote
                    }
                    .padding(16)
                    .padding(.bottom, 30)
                }
            }
        }
        .confirmationDialog("Add your usage", isPresented: $showSourceDialog, titleVisibility: .visible) {
            Button("Take Photo") { showCamera = true }
            Button("Choose from Library") { showLibrary = true }
            Button("Cancel", role: .cancel) {}
        }
        .sheet(isPresented: $showCamera) {
            CameraPicker { img in setImage(img) }.ignoresSafeArea()
        }
        .photosPicker(isPresented: $showLibrary, selection: $photoItem, matching: .images)
        .onChange(of: photoItem) { _, item in
            guard let item else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self),
                   let img = UIImage(data: data) {
                    setImage(img)
                }
            }
        }
        .task {
            selectedModel = appModel.profile?.defaultModel ?? appModel.models.first ?? "Other"
        }
    }

    // MARK: Sections

    private var topBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 1) {
                (Text("Post your ").foregroundStyle(Palette.bone)
                 + Text("burn").foregroundStyle(Palette.fog))
                    .font(.display(22, .bold))
                Text("Screenshot your usage. Claim your rank.")
                    .font(.footnote).foregroundStyle(Palette.fog)
            }
            Spacer()
            Button { dismiss() } label: {
                Image(systemName: "xmark").font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Palette.bone)
                    .frame(width: 34, height: 34).background(Palette.ash, in: Circle())
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
    }

    private var capture: some View {
        Group {
            if let preview {
                ZStack(alignment: .topTrailing) {
                    Image(uiImage: preview).resizable().scaledToFit()
                        .frame(maxWidth: .infinity, maxHeight: 360)
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    Button {
                        self.preview = nil; self.imageData = nil
                    } label: {
                        Image(systemName: "xmark").font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white).padding(9)
                            .background(.black.opacity(0.7), in: Circle())
                    }
                    .padding(10)
                }
            } else {
                Button { showSourceDialog = true } label: {
                    VStack(spacing: 12) {
                        Image(systemName: "camera.fill").font(.system(size: 28)).foregroundStyle(Palette.ink)
                            .frame(width: 64, height: 64).background(Palette.bone, in: Circle())
                        Text("Snap your usage").font(.display(18, .bold)).foregroundStyle(Palette.bone)
                        Label("Take a photo or upload a screenshot", systemImage: "photo.on.rectangle")
                            .font(.footnote).foregroundStyle(Palette.fog)
                    }
                    .frame(maxWidth: .infinity).frame(height: 220)
                    .glass()
                }
            }
        }
    }

    private var tokensField: some View {
        VStack(alignment: .leading, spacing: 6) {
            fieldLabel("Tokens burned today", required: true)
            HStack {
                Image(systemName: "flame.fill").foregroundStyle(Palette.fog)
                TextField("", text: $tokensText, prompt: Text("42,000,000").foregroundStyle(Palette.smoke))
                    .keyboardType(.numberPad)
                    .font(.display(24, .bold))
                    .foregroundStyle(Palette.bone)
                    .onChange(of: tokensText) { _, v in
                        let digits = v.filter(\.isNumber)
                        if let n = Int(digits) {
                            tokensText = NumberFormatter.localizedString(from: NSNumber(value: n), number: .decimal)
                        } else if digits.isEmpty {
                            tokensText = ""
                        }
                    }
            }
            .padding(.horizontal, 16).padding(.vertical, 12)
            .glass(radius: 16)
            Text(tokens > 0
                 ? "That's \(compact(tokens)) tokens · ~\(usd(estimateCost(tokens))) spent"
                 : "Use the number from your AI usage screen.")
                .font(.caption).foregroundStyle(Palette.fog)
        }
    }

    private var modelField: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                fieldLabel("Model")
                Text("· tracked, not ranked").font(.system(size: 10)).foregroundStyle(Palette.dim)
            }
            FlowChips(items: Array(appModel.models.prefix(16)), selected: selectedModel) {
                selectedModel = $0
            }
        }
    }

    private var captionField: some View {
        VStack(alignment: .leading, spacing: 6) {
            fieldLabel("Caption")
            TextField("", text: $caption, prompt: Text("what were you shipping?").foregroundStyle(Palette.smoke), axis: .vertical)
                .lineLimit(2...4)
                .font(.system(size: 14)).foregroundStyle(Palette.bone)
                .padding(.horizontal, 16).padding(.vertical, 12)
                .glass(radius: 16)
        }
    }

    private var submitButton: some View {
        Button { Task { await submit() } } label: {
            HStack(spacing: 8) {
                if submitting {
                    ProgressView().tint(Palette.ink)
                    Text("Posting…")
                } else {
                    Image(systemName: "plus").font(.system(size: 16, weight: .bold))
                    Text("Post today's burn")
                }
            }
            .primaryButton(enabled: canSubmit)
        }
        .disabled(!canSubmit)
    }

    private var streakNote: some View {
        HStack(spacing: 6) {
            Image(systemName: "flame.fill").font(.system(size: 12))
            Text("One burn a day keeps your streak alive.")
        }
        .font(.caption).foregroundStyle(Palette.dim)
    }

    private func errorBanner(_ msg: String) -> some View {
        Text(msg)
            .font(.subheadline).foregroundStyle(Palette.bone)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 16).padding(.vertical, 12)
            .background(Color.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
    }

    private func fieldLabel(_ text: String, required: Bool = false) -> some View {
        HStack(spacing: 2) {
            Text(text.uppercased()).font(.caption).tracking(1).foregroundStyle(Palette.dim)
            if required { Text("*").foregroundStyle(Palette.bone) }
        }
    }

    // MARK: Actions

    private func setImage(_ image: UIImage) {
        preview = image
        imageData = image.jpegData(compressionQuality: 0.85)
        error = nil
    }

    private func submit() async {
        guard let imageData else { error = "Add a screenshot of your usage first."; return }
        guard tokens > 0 else { error = "Enter how many tokens you burned."; return }
        guard appModel.isAuthenticated else { error = "Sign in before posting."; return }

        submitting = true; error = nil
        do {
            let burn = try await API.post(NewBurn(
                image: imageData, imageType: "image/jpeg", tokens: tokens,
                model: selectedModel, caption: caption, cost: nil
            ))
            submitting = false
            onDone(burn)
        } catch {
            self.error = error.localizedDescription
            submitting = false
        }
    }
}

/// Wrapping chip selector for models.
struct FlowChips: View {
    let items: [String]
    let selected: String
    let onTap: (String) -> Void

    var body: some View {
        FlexWrap(items, spacing: 8) { item in
            Button { onTap(item) } label: {
                Text(item)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(item == selected ? Palette.ink : Palette.fog)
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background {
                        if item == selected {
                            Capsule().fill(Palette.bone)
                        } else {
                            Capsule().fill(Palette.panel).overlay(Capsule().strokeBorder(Palette.line))
                        }
                    }
            }
        }
    }
}

/// Minimal wrapping HStack layout.
struct FlexWrap<Data: RandomAccessCollection, Content: View>: View where Data.Element: Hashable {
    let data: Data
    let spacing: CGFloat
    let content: (Data.Element) -> Content

    init(_ data: Data, spacing: CGFloat = 8, @ViewBuilder content: @escaping (Data.Element) -> Content) {
        self.data = data
        self.spacing = spacing
        self.content = content
    }

    var body: some View {
        FlexLayout(spacing: spacing) {
            ForEach(Array(data), id: \.self) { content($0) }
        }
    }
}

/// A simple flow Layout that wraps children onto multiple lines.
struct FlexLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0
        var totalHeight: CGFloat = 0
        var rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                totalHeight += rowHeight + spacing
                x = 0; rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        totalHeight += rowHeight
        return CGSize(width: maxWidth == .infinity ? x : maxWidth, height: totalHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            view.place(at: CGPoint(x: x, y: y), anchor: .topLeading, proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
