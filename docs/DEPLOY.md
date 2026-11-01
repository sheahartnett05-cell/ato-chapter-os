# Deploying Agora (live demo)

## Problem

Pushing to GitHub **does not** update [https://ato-chapter-os.vercel.app](https://ato-chapter-os.vercel.app) unless that Vercel project is connected to this repo and redeploys on every push to `main`. An old build (e.g. `index-Cok3ksOE.js`, “Chaptera” branding) means Vercel is out of sync.

## Option A — GitHub Pages (auto on every push to `main`)

1. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main` (workflow: `.github/workflows/deploy-pages.yml`).
3. Guest demo: **https://sheahartnett05-cell.github.io/ato-chapter-os/preview**

First deploy may take 2–3 minutes after enabling Pages.

## Option B — Vercel (keep `ato-chapter-os.vercel.app`)

1. [vercel.com](https://vercel.com) → open project **ato-chapter-os**.
2. **Settings → Git** → connect **sheahartnett05-cell/ato-chapter-os**, production branch **`main`**.
3. **Deployments → Redeploy** (latest commit).
4. Confirm in page source: `assets/index-*.js` should **not** be the old `Cok3ksOE` hash.

Or from this folder (logged in to Vercel CLI):

```bash
npm run build
npx vercel link
npx vercel deploy --prebuilt --prod
```

## Verify demo after deploy

- Open `/preview` (or your host’s demo entry).
- Officer path should reach `/home` without “is not iterable”.
- Title should be **Agora** (not Chaptera) when running current `main`.
