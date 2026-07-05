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

- The session cookie (`src/lib/session.ts`) is unsigned. Don't build on it assuming tamper-resistance.
- Brand identity is just "a connected wallet" (`BrandGate`) — there's no brand account system.
- The rate limiter (`src/lib/rate-limit.ts`) is in-memory and per-instance.
- USDC issuer addresses are unset by default — see the comment in `src/lib/env.server.ts` before setting them.

## Tests

- Pure logic (`src/lib/**`) gets a plain Vitest unit test (node environment).
- Components with real interaction logic get a React Testing Library test (add `// @vitest-environment jsdom` at the top of the file, and `afterEach(cleanup)` — Vitest doesn't auto-register RTL's cleanup without `globals: true`).
