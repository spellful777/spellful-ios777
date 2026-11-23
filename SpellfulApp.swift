import SwiftUI

@main
struct SpellfulApp: App {
    var body: some Scene {
        WindowGroup { RootView().preferredColorScheme(.dark) }
    }
}

enum SpellfulStyle {
    static let background = Color(red: 0.043, green: 0.035, blue: 0.085)
    static let surface = Color(red: 0.105, green: 0.075, blue: 0.18)
    static let purple = Color(red: 0.64, green: 0.35, blue: 0.88)
    static let muted = Color(red: 0.68, green: 0.61, blue: 0.77)
    static let gold = Color(red: 0.81, green: 0.65, blue: 0.31)
}

struct StarBackdrop: View {
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                SpellfulStyle.background.ignoresSafeArea()
                ForEach(0..<55, id: \.self) { n in
                    Circle().fill(n % 5 == 0 ? SpellfulStyle.gold.opacity(0.42) : SpellfulStyle.purple.opacity(0.27))
                        .frame(width: CGFloat(2 + n % 3), height: CGFloat(2 + n % 3))
                        .position(x: CGFloat((n * 173 + 37) % 397) / 397 * geometry.size.width,
                                  y: CGFloat((n * n * 47 + 11) % 733) / 733 * geometry.size.height)
                }
            }
        }.ignoresSafeArea()
    }
}

struct MagicPanel<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View {
        VStack(alignment: .leading, spacing: 14) { content }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
            .background(SpellfulStyle.surface, in: RoundedRectangle(cornerRadius: 22))
            .overlay(RoundedRectangle(cornerRadius: 22).stroke(SpellfulStyle.purple.opacity(0.25)))
    }
}

struct GoldButton: View {
    let title: String
    let action: () -> Void
    var body: some View {
        Button(action: action) { Text(title).font(.headline).frame(maxWidth: .infinity).padding(15) }
            .foregroundStyle(SpellfulStyle.background)
            .background(SpellfulStyle.gold, in: RoundedRectangle(cornerRadius: 14))
    }
}

struct RootView: View {
    @State private var selected = 0
    var body: some View {
        TabView(selection: $selected) {
            NavigationStack { HomeView(goToTarot: { selected = 1 }) }
                .tabItem { Label("Home", systemImage: "house") }.tag(0)
            NavigationStack { ExploreView() }
                .tabItem { Label("Explore", systemImage: "sparkle.magnifyingglass") }.tag(1)
            NavigationStack { GrimoireView() }
                .tabItem { Label("Grimoire", systemImage: "book.closed") }.tag(2)
            NavigationStack { CovenView() }
                .tabItem { Label("Coven", systemImage: "person.3") }.tag(3)
            NavigationStack { ProfileView() }
                .tabItem { Label("You", systemImage: "person.crop.circle") }.tag(4)
        }
        .tint(SpellfulStyle.gold)
    }
}

struct BrandHeading: View {
    let kicker: String
    let title: String
    var body: some View {
        VStack(spacing: 10) {
            Text(kicker.uppercased()).font(.caption).tracking(4).foregroundStyle(SpellfulStyle.gold)
            Text(title).font(.system(size: 36, weight: .regular, design: .serif)).multilineTextAlignment(.center)
        }.frame(maxWidth: .infinity)
    }
}

struct HomeView: View {
    let goToTarot: () -> Void
    @AppStorage("spellful.displayName") private var displayName = "Brianna"
    var body: some View {
        ZStack {
            StarBackdrop()
            ScrollView {
                VStack(spacing: 24) {
                    Image("Cosmos").resizable().scaledToFill().frame(height: 125).clipped().clipShape(RoundedRectangle(cornerRadius: 20))
                    BrandHeading(kicker: "Welcome back", title: "\(displayName)'s Sanctuary")
                    Text("✦ The stars are brighter with you here. ✦")
                        .font(.system(.body, design: .serif)).italic().foregroundStyle(SpellfulStyle.muted)
                    NavigationLink { MoonView() } label: {
                        MagicPanel {
                            Label("TONIGHT'S MOON", systemImage: "moon.stars.fill")
                                .font(.caption).tracking(2).foregroundStyle(SpellfulStyle.gold)
                            Text(MoonModel.current.phaseName).font(.system(size: 28, design: .serif))
                            Text("\(Int(MoonModel.current.illumination * 100))% illuminated • View the lunar calendar")
                                .foregroundStyle(SpellfulStyle.muted)
                        }
                    }.buttonStyle(.plain)
                    MagicPanel {
                        Text("YOUR DAY AT A GLANCE").tracking(2).font(.caption).foregroundStyle(SpellfulStyle.gold)
                        Text("Philosophy without action is just noise.")
                            .font(.system(size: 31, design: .serif)).italic()
                        Text("Explore something familiar with a new perspective. Make room for curiosity, intention, and reflection today.")
                            .foregroundStyle(SpellfulStyle.muted)
                        Text("✧ Write down one intention to carry forward.").italic().foregroundStyle(SpellfulStyle.purple)
                    }
                    GoldButton(title: "✦ Begin Your Tarot Reading", action: goToTarot)
                    NavigationLink { MoonView() } label: {
                        Label("Explore the Moon Calendar", systemImage: "moonphase.waning.gibbous")
                            .frame(maxWidth: .infinity).padding()
                    }.buttonStyle(.bordered)
                }.padding(18).padding(.bottom, 25)
            }
        }.navigationTitle("Spellful").toolbarBackground(SpellfulStyle.background, for: .navigationBar)
    }
}

struct ExploreView: View {
    var body: some View {
        ZStack {
            StarBackdrop()
            ScrollView {
                VStack(spacing: 22) {
                    BrandHeading(kicker: "Find your magic", title: "Explore Spellful")
                    NavigationLink { TarotView() } label: {
                        MagicPanel {
                            Image(systemName: "sparkles.rectangle.stack").font(.system(size: 45)).foregroundStyle(SpellfulStyle.gold)
                            Text("Tarot & Divination").font(.system(size: 27, design: .serif))
                            Text("Shuffle the deck and draw your cards.").foregroundStyle(SpellfulStyle.muted)
                        }
                    }.buttonStyle(.plain)
                    NavigationLink { MoonView() } label: {
                        MagicPanel {
                            Image(systemName: "moon.stars").font(.system(size: 45)).foregroundStyle(SpellfulStyle.gold)
                            Text("Moon Magic & Rituals").font(.system(size: 27, design: .serif))
                            Text("Track the cycle and reflect on each phase.").foregroundStyle(SpellfulStyle.muted)
                        }
                    }.buttonStyle(.plain)
                }.padding(18)
            }
        }.navigationTitle("Explore")
    }
}

struct TarotCard: Identifiable {
    let id: Int
    let name: String
    let meaning: String
}

struct TarotView: View {
    private let cards: [TarotCard] = [
        .init(id: 0, name: "The Fool", meaning: "New beginnings, an open heart, and the courage to explore."),
        .init(id: 1, name: "The Magician", meaning: "Your skills and intentions can become meaningful action."),
        .init(id: 2, name: "The High Priestess", meaning: "Pause and listen to the wisdom of your intuition."),
        .init(id: 3, name: "The Empress", meaning: "Nurture what is growing and honor your creativity."),
        .init(id: 4, name: "The Emperor", meaning: "Create structure and protect the things you value."),
        .init(id: 5, name: "The Hierophant", meaning: "Learn from tradition, community, and shared wisdom."),
        .init(id: 6, name: "The Lovers", meaning: "Choose in alignment with your values and relationships."),
        .init(id: 7, name: "The Chariot", meaning: "Move forward with purpose and self-direction."),
        .init(id: 8, name: "Strength", meaning: "Meet difficulty with compassion and steady courage."),
        .init(id: 9, name: "The Hermit", meaning: "Make space for solitude and thoughtful insight."),
        .init(id: 10, name: "Wheel of Fortune", meaning: "Recognize change and the cycles of life."),
        .init(id: 11, name: "Justice", meaning: "Consider truth, fairness, and responsibility."),
        .init(id: 12, name: "The Hanged Man", meaning: "A different perspective may illuminate a new path."),
        .init(id: 13, name: "Death", meaning: "Endings make room for transformation and renewal."),
        .init(id: 14, name: "Temperance", meaning: "Seek balance, patience, and gentle integration."),
        .init(id: 15, name: "The Devil", meaning: "Notice patterns and reclaim your freedom to choose."),
        .init(id: 16, name: "The Tower", meaning: "Let outdated foundations clear the way for growth."),
        .init(id: 17, name: "The Star", meaning: "Hold on to hope, renewal, and your inner light."),
        .init(id: 18, name: "The Moon", meaning: "Move carefully through uncertainty and emotion."),
        .init(id: 19, name: "The Sun", meaning: "Welcome clarity, joy, and creative energy."),
        .init(id: 20, name: "Judgement", meaning: "Reflect, awaken, and respond to your calling."),
        .init(id: 21, name: "The World", meaning: "Celebrate completion and the next horizon.")
    ]
    @State private var draw: [TarotCard] = []
    @State private var spread = 1
    var body: some View {
        ZStack {
            StarBackdrop()
            ScrollView {
                VStack(spacing: 24) {
                    BrandHeading(kicker: "Tarot sanctuary", title: "The Cards Are Waiting.")
                    Text("Draw a card for reflection and personal insight.")
                        .multilineTextAlignment(.center).foregroundStyle(SpellfulStyle.muted)
                    Picker("Spread", selection: $spread) {
                        Text("One Card").tag(1)
                        Text("Past · Present · Future").tag(3)
                    }.pickerStyle(.segmented)
                    if draw.isEmpty {
                        Image(systemName: "sparkles.rectangle.stack.fill")
                            .font(.system(size: 100)).foregroundStyle(SpellfulStyle.purple).padding(35)
                    } else {
                        ForEach(Array(draw.enumerated()), id: \.element.id) { index, card in
                            MagicPanel {
                                Text(spread == 3 ? ["PAST", "PRESENT", "FUTURE"][index] : "YOUR CARD")
                                    .font(.caption).tracking(2).foregroundStyle(SpellfulStyle.gold)
                                Text("✦ \(card.name) ✦").font(.system(size: 28, design: .serif))
                                Text(card.meaning).foregroundStyle(SpellfulStyle.muted)
                            }
                        }
                    }
                    GoldButton(title: draw.isEmpty ? "Shuffle & Draw" : "Draw Again") {
                        draw = Array(cards.shuffled().prefix(spread))
                    }
                    Text("Tarot is intended for entertainment and self-reflection.")
                        .font(.footnote).foregroundStyle(SpellfulStyle.muted)
                }.padding(18)
            }
        }.navigationTitle("Tarot")
    }
}

struct GrimoireEntry: Codable, Identifiable {
    var id = UUID()
    var title: String
    var category: String
    var body: String
    var created = Date()
}

struct GrimoireView: View {
    @AppStorage("spellful.grimoire") private var saved = Data()
    @State private var entries: [GrimoireEntry] = []
    @State private var showingAdd = false
    @State private var category = "All"
    private let categories = ["All", "Spell", "Herb", "Crystal", "Ritual", "Tarot", "Dream", "Journal"]
    var filtered: [GrimoireEntry] { entries.filter { category == "All" || $0.category == category } }
    var body: some View {
        ZStack {
            StarBackdrop()
            ScrollView {
                VStack(spacing: 20) {
                    BrandHeading(kicker: "Your personal book of shadows", title: "My Grimoire")
                    Text("\(entries.count) entries").foregroundStyle(SpellfulStyle.gold)
                    GoldButton(title: "+ New Entry") { showingAdd = true }
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            ForEach(categories, id: \.self) { item in
                                Button(item) { category = item }
                                    .padding(.horizontal, 14).padding(.vertical, 9)
                                    .background(category == item ? SpellfulStyle.gold : SpellfulStyle.surface,
                                                in: Capsule())
                                    .foregroundStyle(category == item ? SpellfulStyle.background : SpellfulStyle.muted)
                            }
                        }
                    }
                    if filtered.isEmpty {
                        MagicPanel {
                            Text("Your grimoire is ready").font(.system(size: 25, design: .serif))
                            Text("Add a journal entry, ritual note, or idea to begin.").foregroundStyle(SpellfulStyle.muted)
                        }
                    }
                    ForEach(filtered) { entry in
                        MagicPanel {
                            Text(entry.category.uppercased()).font(.caption).foregroundStyle(SpellfulStyle.gold)
                            Text(entry.title).font(.system(size: 23, design: .serif))
                            Text(entry.body).foregroundStyle(SpellfulStyle.muted)
                            Text(entry.created, style: .date).font(.caption2).foregroundStyle(SpellfulStyle.muted)
                            Button(role: .destructive) { entries.removeAll { $0.id == entry.id }; persist() } label: {
                                Label("Delete entry", systemImage: "trash").font(.caption)
                            }
                        }
                    }
                }.padding(18)
            }
        }
        .navigationTitle("Grimoire")
        .onAppear { entries = (try? JSONDecoder().decode([GrimoireEntry].self, from: saved)) ?? [] }
        .sheet(isPresented: $showingAdd) { EntryEditor { newEntry in entries.insert(newEntry, at: 0); persist() } }
    }
    private func persist() { saved = (try? JSONEncoder().encode(entries)) ?? Data() }
}

struct EntryEditor: View {
    @Environment(\.dismiss) private var dismiss
    let save: (GrimoireEntry) -> Void
    @State private var title = ""
    @State private var text = ""
    @State private var category = "Journal"
    var body: some View {
        NavigationStack {
            Form {
                TextField("Title", text: $title)
                Picker("Category", selection: $category) {
                    ForEach(["Journal", "Spell", "Herb", "Crystal", "Ritual", "Tarot", "Dream"], id: \.self) { Text($0) }
                }
                TextEditor(text: $text).frame(minHeight: 190)
            }
            .navigationTitle("New Grimoire Entry")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save(.init(title: title, category: category, body: text)); dismiss() }
                        .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }.tint(SpellfulStyle.gold)
    }
}

struct CovenView: View {
    var body: some View {
        ZStack {
            StarBackdrop()
            ScrollView {
                VStack(spacing: 20) {
                    Image("Cosmos").resizable().scaledToFill().frame(height: 150).clipped().clipShape(RoundedRectangle(cornerRadius: 20))
                    BrandHeading(kicker: "The Spellful Community", title: "Choose Your Magical Path")
                    Text("A space to share wisdom, ask questions, and walk the path together.")
                        .multilineTextAlignment(.center).foregroundStyle(SpellfulStyle.muted)
                    ForEach(["Beginner Witchcraft", "Tarot & Divination", "Moon Magic & Rituals", "Herbs & Crystals"], id: \.self) { path in
                        MagicPanel {
                            Label(path, systemImage: "sparkles").font(.system(size: 21, design: .serif))
                            Text("Community discussions are available on spellful.com.")
                                .font(.subheadline).foregroundStyle(SpellfulStyle.muted)
                        }
                    }
                    Link(destination: URL(string: "https://spellful.com")!) {
                        Text("Visit the Spellful Community").frame(maxWidth: .infinity).padding()
                    }.buttonStyle(.borderedProminent).tint(SpellfulStyle.gold)
                    Text("Community posting and sync require connecting your existing website account system.")
                        .font(.caption).foregroundStyle(SpellfulStyle.muted)
                }.padding(18)
            }
        }.navigationTitle("Coven")
    }
}

struct ProfileView: View {
    @AppStorage("spellful.displayName") private var name = "Brianna"
    @AppStorage("spellful.handle") private var handle = "Seven"
    @AppStorage("spellful.sun") private var sun = "Sagittarius"
    @AppStorage("spellful.moon") private var moon = "Sagittarius"
    @AppStorage("spellful.rising") private var rising = "Pisces"
    @AppStorage("spellful.bio") private var bio = "Finding magic in everyday moments."
    var body: some View {
        ZStack {
            StarBackdrop()
            ScrollView {
                VStack(spacing: 18) {
                    BrandHeading(kicker: "Make it yours", title: "Profile Studio")
                    MagicPanel {
                        Image(systemName: "moon.stars.circle.fill")
                            .font(.system(size: 70)).foregroundStyle(SpellfulStyle.purple)
                        Text(name).font(.system(size: 30, design: .serif))
                        Text("@\(handle)").foregroundStyle(SpellfulStyle.muted)
                        Text("☀ \(sun)  ☾ \(moon)  ↑ \(rising)")
                            .foregroundStyle(SpellfulStyle.gold)
                    }
                    MagicPanel {
                        Text("PERSONAL DETAILS").font(.caption).tracking(2).foregroundStyle(SpellfulStyle.gold)
                        profileField("Display name", text: $name)
                        profileField("Username", text: $handle)
                        profileField("Sun sign", text: $sun)
                        profileField("Moon sign", text: $moon)
                        profileField("Rising sign", text: $rising)
                        TextField("About my path", text: $bio, axis: .vertical).lineLimit(3...5)
                    }
                    Text("Your profile is stored on this device in this starter app.")
                        .font(.caption).foregroundStyle(SpellfulStyle.muted)
                }.padding(18)
            }
        }.navigationTitle("You")
    }
    private func profileField(_ title: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title).font(.caption).foregroundStyle(SpellfulStyle.muted)
            TextField(title, text: text).textInputAutocapitalization(.words)
                .padding(10).background(SpellfulStyle.background, in: RoundedRectangle(cornerRadius: 10))
        }
    }
}

struct MoonModel {
    let illumination: Double
    let age: Double
    var phaseName: String {
        switch age {
        case ..<1.85: return "New Moon"
        case ..<5.54: return "Waxing Crescent"
        case ..<9.23: return "First Quarter"
        case ..<12.92: return "Waxing Gibbous"
        case ..<16.61: return "Full Moon"
        case ..<20.30: return "Waning Gibbous"
        case ..<23.99: return "Last Quarter"
        default: return "Waning Crescent"
        }
    }
    static var current: MoonModel {
        // Approximate synodic lunar cycle, epoch 2000-01-06 18:14 UTC.
        let epoch = Date(timeIntervalSince1970: 947182440)
        let days = Date().timeIntervalSince(epoch) / 86400
        let age = ((days.truncatingRemainder(dividingBy: 29.530588853)) + 29.530588853)
            .truncatingRemainder(dividingBy: 29.530588853)
        let illumination = (1 - cos(2 * .pi * age / 29.530588853)) / 2
        return .init(illumination: illumination, age: age)
    }
}

struct MoonView: View {
    var body: some View {
        ZStack {
            StarBackdrop()
            ScrollView {
                VStack(spacing: 25) {
                    BrandHeading(kicker: "Lunar sanctuary", title: "Discover Your Moon")
                    MagicPanel {
                        Image(systemName: "moonphase.full.moon")
                            .font(.system(size: 140)).foregroundStyle(SpellfulStyle.gold)
                            .frame(maxWidth: .infinity).padding(25)
                        Text(MoonModel.current.phaseName)
                            .font(.system(size: 35, design: .serif)).frame(maxWidth: .infinity)
                        Text("Approximately \(Int(MoonModel.current.illumination * 100))% illuminated")
                            .foregroundStyle(SpellfulStyle.muted).frame(maxWidth: .infinity)
                        Text(Date.now, format: .dateTime.weekday(.wide).month(.wide).day().year())
                            .frame(maxWidth: .infinity)
                    }
                    MagicPanel {
                        Text("TONIGHT'S REFLECTION").font(.caption).tracking(2).foregroundStyle(SpellfulStyle.gold)
                        Text("What are you ready to welcome, release, or transform?")
                            .font(.system(size: 25, design: .serif))
                        Text("Set an intention and record your thoughts in your grimoire.")
                            .foregroundStyle(SpellfulStyle.muted)
                    }
                    Text("Moon phase is approximate and calculated on-device. It is not an astronomical ephemeris.")
                        .font(.caption).foregroundStyle(SpellfulStyle.muted)
                }.padding(18)
            }
        }.navigationTitle("Moon Calendar")
    }
}
