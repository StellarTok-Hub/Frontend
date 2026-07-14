# Contributing

## Setup

```bash
npm install
cp .env.example .env.local   # fill in what you have; every route works on fixtures otherwise
npm run dev
```

## Scripts

| Command             | What it does                               |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Start the dev server                       |
| `npm run build`     | Production build                           |
| `npm run typecheck` | `tsc --noEmit`                             |
| `npm run lint`      | ESLint (`next/core-web-vitals`)            |
| `npm test`          | Unit + component tests (Vitest)            |
| `npm run format`    | Prettier, including Tailwind class sorting |

A pre-commit hook (Husky + lint-staged) runs ESLint and Prettier on staged files automatically.

## The mock-data-fallback pattern

There's no live StellarTok backend yet. Every page that needs backend data follows the same shape:

```ts
async function loadX(): Promise<X> {
  try {
    return await getXFromApi();
  } catch {
    return mockX; // src/lib/mock-data.ts
  }
}
```

Keep new data-fetching code consistent with this — don't hardcode mock data directly in a page component, and don't skip the live-API attempt even though it'll fail locally. This is what lets the app run standalone today and pick up the real backend later with no page-level changes.

## Server-only modules

`src/lib/stellar.ts` and `src/lib/env.server.ts` import dependencies (the Stellar SDK, Zod) that must never reach the client bundle. If you need something from either in a client component, add a thin API route instead of importing the module directly — see `src/app/api/tip/route.ts` for the pattern, and `src/lib/stellar-client.ts` for the client-side fetch wrapper.

## Known simplifications

These are intentional, documented shortcuts — not things to silently "fix" without discussion:

- The session cookie (`src/lib/session.ts`) is HMAC-signed and verified in middleware — tamper-resistant, but the dev-mode fallback secret (used when `SESSION_SECRET` is unset outside production) is random per-process, so don't rely on dev sessions surviving a restart.
- Brand identity is "a connected wallet" backed by a signed cookie (`encodeWalletSession`), checked in middleware for `/brand` — but there's still no brand account system, and no proof the visitor holds the wallet's private key, only that the server saw Freighter hand back that public key once.
- The rate limiter (`src/lib/rate-limit.ts`) is in-memory and per-instance — on Vercel's default multi-instance deploy this is bypassable today, not just at scale, so treat it as UX rather than a real abuse control until it's backed by a shared store. It keys on the proxy-appended `x-forwarded-for` hop, which assumes a single trusted reverse proxy in front of the app.
- USDC issuer addresses are unset by default — see the comment in `src/lib/env.server.ts` before setting them.
- The CSP (`next.config.mjs`) keeps `'unsafe-inline'` for `script-src`/`style-src` — Next.js App Router's inline hydration scripts need it unless a nonce-based CSP is wired through middleware, which hasn't been done yet.

## Tests

- Pure logic (`src/lib/**`) gets a plain Vitest unit test (node environment).
- Components with real interaction logic get a React Testing Library test (add `// @vitest-environment jsdom` at the top of the file, and `afterEach(cleanup)` — Vitest doesn't auto-register RTL's cleanup without `globals: true`).
