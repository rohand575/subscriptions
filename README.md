# Subscriptions

A premium, minimalist tracker for all your subscriptions across **EUR (€)** and **INR (₹)** —
see where your money goes, with a calendar of renewals, spending analytics, and renewal reminders.
Runs as a responsive web app (GitHub Pages) and as a native Android app (Capacitor).

- **Web:** React + Vite + TypeScript + Tailwind
- **Data/Auth:** Firebase (Firestore + Google sign-in, private to you)
- **Android:** Capacitor + local notifications
- **Hosted at:** `subscriptions.rohan-dhanawade.de`

## Getting started (local)

```bash
npm install
cp .env.example .env      # then fill in your Firebase web config
npm run dev
```

### Firebase setup (one-time)

1. Create a project at <https://console.firebase.google.com>.
2. **Build → Firestore Database** → create database (production mode).
3. **Build → Authentication → Sign-in method** → enable **Google**.
4. **Project settings → Your apps → Web app** → copy config into `.env`.
5. **Authentication → Settings → Authorized domains** → add `localhost` and
   `subscriptions.rohan-dhanawade.de`.
6. Publish the security rules from [`firestore.rules`](firestore.rules)
   (Firestore → Rules, or `firebase deploy --only firestore:rules`).

## Deploy (web → GitHub Pages)

1. Push to `main`. The [workflow](.github/workflows/deploy.yml) builds and publishes to Pages.
2. In the repo: **Settings → Pages → Source: GitHub Actions**.
3. Add the `VITE_FIREBASE_*` values as **repo secrets** (Settings → Secrets → Actions) so the
   build can read them.
4. DNS: add a `CNAME` record `subscriptions` → `<github-username>.github.io`.
   [`public/CNAME`](public/CNAME) already pins the custom domain.

## Android (native APK)

Requires Android Studio.

```bash
npx cap add android          # first time only
npm run cap:android          # build web, sync, open Android Studio
```

Then build/sign the APK from Android Studio. Renewal reminders use local notifications and
work offline once granted.

## Notes

- Currency totals are kept **separate** per currency (no conversion).
- Renewal dates are derived from each subscription's first billing date + cycle.
- Background **web** push (when the app is closed) would need FCM + Cloud Functions — a
  future enhancement. Native Android reminders already work in the background.
