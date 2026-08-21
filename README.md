
# ZenoFit
A dark-first Expo mobile app for planning workouts, logging sets, tracking strength, and scheduling workout reminders.

## Run locally

```sh
npm install
npm start
```

Use Expo Go or an iOS/Android simulator to open the app.

## Cloud sync setup

1. Create a Supabase project.
2. Apply the schema — either:
   - **Automatic (recommended):** connect the project's GitHub integration to this repo (Project Settings → Integrations → GitHub), pointing at the `main` branch with "Deploy to production" enabled. Everything in [`supabase/migrations`](./supabase/migrations) deploys automatically on merge.
   - **Manual:** run the SQL in [`supabase/migrations/20260813124802_initial_schema.sql`](./supabase/migrations/20260813124802_initial_schema.sql) directly in the Supabase SQL editor.
3. Copy `.env.example` to `.env` and set the project URL and anonymous key.
4. Restart Expo, then use **Profile → Cloud sync** to create an account or sign in.

The app remains usable in local demo mode when those keys are not configured. The database schema includes row-level security policies for all user-owned records.
