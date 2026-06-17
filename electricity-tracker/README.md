# Electricity Tracker

A multi-user web app to track electricity consumption, recharges, and costs. Built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Firebase (Auth + Firestore).

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

### 4. Deploy the security rules

```bash
firebase deploy --only firestore:rules
```

Or paste the contents of `firestore.rules` into the Firebase console under **Firestore → Rules**.

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
users/{uid}                              # User profile doc
  email: string
  defaultRate: number                    # ₦/kWh, used for auto-cost
  createdAt: Timestamp

users/{uid}/entries/{entryId}            # Subcollection
  type: 'recharge' | 'usage'
  units: number                          # kWh
  costNgn: number                        # Naira
  ratePerKwh: number                     # Snapshot at creation
  note: string | null
  entryDate: string                      # YYYY-MM-DD
  createdAt: Timestamp
```

Security rules ensure users can only read/write their own user document and their own entries subcollection.

## License

Open source — do whatever you want with it.
