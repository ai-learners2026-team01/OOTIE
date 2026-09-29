# OOTie Supabase deployment guide

This project is built as a guest-first app: public pages remain accessible without login, while private actions open the auth modal first. The Supabase layer is prepared to support real email auth, user profile storage, and per-user wardrobe data.

## 1. Create a Supabase project

1. Open Supabase dashboard.
2. Create a new project.
3. Save the following values:
   - Project URL
   - anon key
   - service role key only if needed later for server-side writes

## 2. Enable auth

In Supabase Dashboard:

- Go to Authentication > Providers
- Enable Email
- Optional: enable email confirmation depending on product requirements

## 3. Create the database schema

Open the SQL Editor in Supabase and run the contents of [schema.sql](schema.sql).

This creates:
- public.profiles
- public.items
- row-level security policies
- updated_at trigger functions

## 4. Configure the frontend

The app already reads the config from localStorage and global variables.

Before app startup, you can set:

```js
window.OOTIE_SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
window.OOTIE_SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

Or store them in localStorage:

```js
localStorage.setItem('OOTIE_SUPABASE_URL', 'https://YOUR_PROJECT.supabase.co');
localStorage.setItem('OOTIE_SUPABASE_ANON_KEY', 'YOUR_ANON_KEY');
```

## 5. Runtime behavior

The app is designed to behave like this:

- If no user is logged in:
  - public pages still work
  - private actions trigger the auth modal
- If a user logs in:
  - session is synced with Supabase
  - profile is loaded or created
  - wardrobe items are loaded
  - private features become available

## 6. Required tables and fields

### profiles
- id
- user_id
- email
- full_name
- username
- initials
- bio
- avatar_url
- hearts
- helped
- likes
- public_closet
- created_at
- updated_at

### items
- id
- user_id
- name
- name_zh
- brand
- category
- shape
- primary_color
- secondary_color
- color_hex
- style
- season
- photo
- wear_count
- last_worn
- purchase_date
- favorite
- hidden
- notes
- created_at
- updated_at

## 7. RLS rules

The database is set to allow each user to only access their own rows.

This means:
- users can read their own profile
- users can update their own profile
- users can create and edit their own closet items
- data from other users is protected

## 8. Final deployment checklist

Before launch, confirm all of the following:

- [ ] Supabase project exists
- [ ] Project URL is correct
- [ ] anon key is valid
- [ ] Email Auth is enabled
- [ ] schema has been executed successfully
- [ ] RLS policies are active
- [ ] user sign-up works
- [ ] user sign-in works
- [ ] profile is created or updated correctly
- [ ] items can be created, read, and edited by the same user
- [ ] guest browsing still works without login
- [ ] private actions redirect to login modal when logged out

## 9. Local validation steps

Run these in a local environment with Python or any static file server:

```bash
cd legacy/ming
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000/profile.html
```

Then verify:

1. profile page loads
2. Edit Profile opens auth modal when logged out
3. login/signup toggle works properly
4. after auth, the app updates user state
5. data sync works against the real Supabase project

## 10. Notes

This app is intentionally designed to keep the public experience open while gating personalized actions behind authentication. That makes it friendly to first-time visitors while still preparing the app for real user data and future AI-powered recommendation features.
