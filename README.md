# Burnt

Burnt is a screenshot-first AI token usage tracker. The web and native iOS apps share real Supabase accounts, public profiles, avatar and screenshot uploads, personalized feeds, tracked AI models, streaks, and leaderboards ranked by tokens used.

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

### Theming

Both apps ship dark and light modes. The web app follows the system theme by default; the sun/moon toggle in the nav saves an explicit choice to `localStorage` (applied before first paint, no flash). The iOS app follows the system appearance, with a System/Dark/Light picker in Account settings.

### Supabase

The web app requires Supabase for real sign-ups, posting, following, profile editing, and avatar upload. Without Supabase env vars, it intentionally starts empty and does not create fake accounts.

One-time provisioning (creates the project, applies schema, and wires env):

```bash
cd web
npx supabase projects create burnt --org-id <org-id> --db-password <pw> --region us-east-1
npx supabase link --project-ref <project-ref>
npx supabase db push

# local dev: fill these two values in web/.env.local
#   NEXT_PUBLIC_SUPABASE_URL          (dashboard → Project Settings → API)
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# production: push the same two vars to Vercel
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
```

The migrations create:

- Supabase Auth-linked `profiles`
- `burns` token usage posts
- `follows`
- `ai_models`, including newly observed custom model names
- public avatar and burn-screenshot storage buckets with owner-scoped upload policies
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

The iOS app uses the same account and API as the website. It includes secure Keychain session storage, automatic token refresh, sign-up/sign-in, profile editing, avatar upload, personalized feeds, posting, streaks, and leaderboards.

The simulator defaults to `http://localhost:3111`; set the `burnt.baseURL` UserDefaults key to override it. Device builds use the production Burnt URL.
