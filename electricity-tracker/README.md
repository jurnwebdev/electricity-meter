# Electricity Tracker

A multi-user web app to track electricity consumption, recharges, and physical meter readings. Built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Firebase (Auth + Firestore).

## How it works

The app is designed around **two physical meters + one app-derived value**:

- **Credit meter** (cumulative, never reset) — the physical reading always ticks up as electricity flows through it. The app derives the expected reading and lets you optionally log the actual physical reading to catch drift.
- **Usage meter** (resettable) — reset to 0 at each top-up. The app derives the expected reading using the same delta.
- **App units remaining** — the only number you actually have to enter. The app computes how much electricity was consumed since your last entry, and bumps both meter readings by that delta automatically.

After a one-time onboarding, the only daily action is logging "current units remaining." Meter 1 and Meter 2 readings update themselves. Top-ups add units and reset the usage meter reading to 0.

## Features

- **Email/password authentication** — each user has their own private data
- **Dashboard** — remaining units, estimated days left, monthly spend, daily average, quick log forms
- **History** — filter by type and date range, export to CSV (respects active filters)
- **Settings** — default recharge rate, edit/delete any entry
- **Real-time updates** — entries and rate sync across tabs via Firestore listeners
- **Multi-currency-ready** — formatting uses Intl with Naira symbol

## Tech stack

- **Next.js 16** (App Router, Turbopack, React Compiler)
- **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** + **Blode UI** components
- **Firebase** (Auth + Firestore) — client SDK
- **React Hook Form** + **Zod** for input validation
- **date-fns** for date math
- **Oxlint** + **Oxfmt** via **Ultracite** for linting/formatting
- **Turborepo** for the monorepo shell

## Project structure

```
electricity-tracker/
├── electricity-tracker/        # The Next.js web app (workspace)
│   ├── app/
│   │   ├── (auth)/             # Login, signup (unauthenticated)
│   │   ├── (app)/              # Authenticated app shell + routes
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── history/
│   │   │   └── settings/
│   │   │       └── edit/[id]/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/             # UI components (shadcn + custom)
│   ├── lib/
│   │   ├── firebase/           # Firebase client + data access
│   │   ├── calculations.ts     # Pure metric functions
│   │   ├── csv.ts              # CSV export
│   │   ├── date.ts             # Date helpers
│   │   ├── format.ts           # Currency/unit formatters
│   │   ├── types.ts            # Shared types
│   │   └── utils.ts            # cn() helper
│   └── package.json
├── firestore.rules             # Security rules
├── package.json                # Turborepo root
├── turbo.json
└── .env.local.example
```

## Prerequisites

- Node.js 22+ (Next.js 16 requires it)
- A Firebase project (free Spark tier is enough)

## Setup

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project.
2. In **Build → Authentication**, click "Get started" and enable **Email/Password**.
3. In **Build → Firestore Database**, create a database (start in production mode).
4. In **Project settings → General → Your apps**, register a web app and copy the config object.

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in the values from your Firebase web app config. All keys must be prefixed with `NEXT_PUBLIC_` so they're available to the client.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up.

### 4. Deploy the security rules and indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Or paste the contents of `firestore.rules` and `firestore.indexes.json` into the Firebase console under **Firestore → Rules** and **Firestore → Indexes**.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in [vercel.com/new](https://vercel.com/new). Vercel auto-detects the Turborepo and the Next.js app at `electricity-tracker/`.
3. Add the `NEXT_PUBLIC_FIREBASE_*` environment variables in the Vercel project settings.
4. Deploy.

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint with Oxlint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Oxfmt |
| `npm run check-types` | TypeScript type check |
| `npm run check` | Run Ultracite (lint + format) |
| `npm run fix` | Auto-fix lint + format |

## Data model (Firestore)

```
users/{uid}                                 # User profile doc
  email: string
  defaultRate: number
  meterSetup: {                             # present after dual-meter onboarding
    creditMeterName: "Credit meter"
    usageMeterName: "Usage meter"
    driftThreshold: number                  # kWh; warn if drift exceeds
    reminderHour: number                    # 0-23, when to email the reminder
    reminderEmail: string
  }
  reminderEnabled: boolean

users/{uid}/events/{eventId}                # Event log (single source of truth)
  type: 'onboarding' | 'checkin' | 'recharge' | 'physical_meter' | 'baseline_adjusted'
  date: string                              # YYYY-MM-DD
  createdAt: Timestamp
  # (plus type-specific fields — see src/lib/types.ts)
```

Every dashboard value (units remaining, credit meter reading, usage meter reading, monthly spend, etc.) is **derived** from this event log via `reduceEvents` in `src/lib/calculations.ts`. There is no separate stored state to keep in sync.

## License

Open source — do whatever you want with it.
