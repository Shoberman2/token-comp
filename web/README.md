# Burnt Web

Next.js app and API for verified AI token usage posts. It powers both the web experience and the native iOS app, including account sessions, profiles, posting, follows, and personalized feeds.

## Supabase Setup

1. Create or choose a Supabase project.
2. Apply the SQL migration:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

3. Add these variables locally and in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported as a fallback key name.

The migrations create:

- `profiles` linked to `auth.users`
- `burns` for token usage posts
- `follows` for the social graph
- `ai_models` for built-in and newly observed model names
- public avatar and burn-screenshot storage buckets with owner-scoped RLS policies
- public best-token-day views for shareable profile stats

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Without Supabase env vars, the app does not create fake users or seeded posts. Sign-up, posting, following, and profile editing require Supabase.
