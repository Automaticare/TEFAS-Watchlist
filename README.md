# TEFAS Watchlist

A personal fund tracking application for monitoring funds on Takasbank TEFAS (Turkey Electronic Fund Trading Platform).

**Live:** [tefas-watchlist.web.app](https://tefas-watchlist.web.app)

## Features

- **Portfolio Overview** — Track your fund positions with real-time prices, daily/weekly/monthly returns, position value, and P&L
- **Buy/Sell Records** — Log fund transactions with quantity, price per unit, and date
- **Fund Search** — Autocomplete search across all TEFAS funds by code or name
- **Charts** — Return comparison bar chart and multi-fund price chart with base-100 normalization
- **Fund Detail** — Individual fund page with price history chart and portfolio allocation donut chart
- **Authentication** — Email/password login (single user, created via Firebase Console)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) |
| Charts | Recharts |
| Backend / DB | Firebase (Firestore + Hosting + Cloud Functions + Auth) |
| Data Source | TEFAS internal API (`tefas.gov.tr/api/DB/`) |

## Data Source

TEFAS does not provide an official public API. This project uses the internal endpoints that power the TEFAS website:

- **Endpoints:** `BindHistoryInfo` (price, investors, market cap), `BindHistoryAllocation` (portfolio allocation)
- **Method:** POST (`application/x-www-form-urlencoded`)
- **Date range limit:** Max 90 days per request (automatic chunking)
- **Fund types:** YAT, EMK, BYF — auto-detected per fund
- **CORS:** Vite proxy in dev, Firebase Cloud Function proxy in production

## Setup

```bash
# Install dependencies
npm install

# Copy environment template and fill in Firebase config
cp .env.example .env

# Start dev server
npm run dev
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database**, **Authentication** (Email/Password), and **Hosting**
3. Create a user in Firebase Console → Authentication → Users
4. Upgrade to Blaze plan (required for Cloud Functions, stays within free tier)
5. Deploy Cloud Function: `cd functions && npm install && cd .. && firebase deploy --only functions`

### Environment Variables

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Deploy

```bash
npm run build && firebase deploy
```

## License

MIT
