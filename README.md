# Design for AI — Assignment 3

This Next.js app extends the Assignment 2 Supabase course catalog with Google
authentication, trigger-created profiles, editable names, avatar uploads, and a
protected dashboard.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the existing Supabase project
   URL and publishable anon key.
3. Apply `supabase/migrations/20260929000000_create_profiles.sql` to the existing
   Supabase project.
4. Run `npm run dev` and open `http://localhost:3000`.

Do not commit `.env.local`, OAuth secrets, or service-role keys.

## Google authentication

Create a Google OAuth Web application. In Google Cloud, use the Supabase Google
provider callback URL shown by Supabase Auth as the authorized redirect URI.
Enter the Google client ID and secret in Supabase Auth → Providers → Google.

The application itself always requests this callback path:

```text
/auth/callback
```

Add these application URLs to the Supabase Auth redirect allow list:

```text
http://localhost:3000/auth/callback
https://<production-domain>/auth/callback
https://<commit-preview-domain>/auth/callback
```

## Profiles and avatars

The SQL migration creates `public.profiles`, an `auth.users` insert trigger, the
public `avatars` Storage bucket, and owner-scoped RLS policies. First and last
name remain nullable in PostgreSQL so a newly created profile can exist before
onboarding is complete.

Avatar files are stored in Supabase Storage under the signed-in user's folder.
The relational table stores only `avatar_path`. JPEG, PNG, WebP, and GIF files up
to 5 MB are accepted.

## Verification

```bash
npm test
npm run lint
npm run build
```

Before submitting, verify Google sign-in, first-login profile creation, the
missing-name prompt, profile editing, avatar upload, sign-out, and signed-out
redirects from `/dashboard`. Disable Vercel Deployment Protection so the exact
commit deployment opens in an Incognito window, then submit that commit-specific
URL.
