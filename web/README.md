# Burnt Web

Next.js app for verified AI token usage posts. Users sign up with Supabase Auth, keep public profiles with company/avatar information, post daily token usage screenshots, and share join links.

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

The migration creates:

- `profiles` linked to `auth.users`
- `burns` for token usage posts
- `follows` for the social graph
- `ai_models` for built-in and newly observed model names
- public avatar storage bucket and RLS policies
- public best-token-day views for shareable profile stats

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Without Supabase env vars, the app does not create fake users or seeded posts. Sign-up, posting, following, and profile editing require Supabase.
