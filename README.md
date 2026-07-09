# Burnt

Burnt is a screenshot-first AI token usage tracker. The web app uses real Supabase accounts, public profiles, company/profile information, avatar uploads, join links, tracked AI models, and leaderboards ranked by tokens used.

```text
tokenizer/
├─ web/     Next.js 16 web app
└─ ios/     Native SwiftUI app
```

## Web

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

### Supabase

The web app requires Supabase for real sign-ups, posting, following, profile editing, and avatar upload. Without Supabase env vars, it intentionally starts empty and does not create fake accounts.

Required public env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Apply the database/storage/Auth schema:

```bash
cd web
supabase link --project-ref <project-ref>
supabase db push
```

The migration creates:

- Supabase Auth-linked `profiles`
- `burns` token usage posts
- `follows`
- `ai_models`, including newly observed custom model names
- public avatar storage bucket and policies
- public best-token-day profile stats
- join codes for `/join/[code]`

## Validation

```bash
cd web
npm run lint
npm run build
```

## iOS

```bash
cd ios
xcodegen generate
open Burnt.xcodeproj
```

The iOS app is included in this workspace, but the current production-ready auth/profile flow is implemented in the web app.
