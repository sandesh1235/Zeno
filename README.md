
# ZenoFit
A dark-first Expo mobile app for planning workouts, logging sets, tracking strength, and scheduling workout reminders.

## Run locally

```sh
npm install
npm start
```

Use Expo Go or an iOS/Android simulator to open the app.

## Cloud sync setup

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL editor.
2. Copy `.env.example` to `.env` and set the project URL and anonymous key.
3. Restart Expo, then use **Profile → Cloud sync** to create an account or sign in.

The app remains usable in local demo mode when those keys are not configured. The database schema includes row-level security policies for all user-owned records.
