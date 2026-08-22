# E2E tests (Playwright)

These tests drive a real browser against a real Supabase backend — a
**separate test project**, kept isolated from your real financial data.

## One-time setup

1. **Create a new Supabase project** (Supabase dashboard → New Project). Free
   tier is fine. Name it something like `budgetflowapp-test`.
2. **Run exactly these 3 files, in this order**, in that project's SQL
   editor:
   - `supabase/schema.sql` — the comprehensive base (all tables, RLS
     policies, storage policies, the email-notification trigger)
   - `supabase/add-tasks-table.sql` — the one table not yet folded into
     `schema.sql`
   - `supabase/add-invoice-tracker-link.sql` — despite the name, this is
     just the final, complete version of the `run_daily_automations()`
     function, also not yet folded into `schema.sql`

   Don't run any other file in `supabase/` — they're either already fully
   covered by `schema.sql` (running them again errors with "policy already
   exists") or are one-time real personal data imports
   (`import-2025-business-expenses.sql`, `fix-missing-td-fee-row.sql`) that
   have no place in a test project.
3. **Create two storage buckets** via the Dashboard's Storage section (not
   SQL) — `files` (private) and `avatars` (public). `schema.sql`'s storage
   policies expect these to already exist.
4. **Copy `.env.test.example` to `.env.test`** and fill in:
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from the test project's
     API settings (Project Settings → API). The anon key is safe to have
     client-side, same as your real project's.
   - `SUPABASE_SERVICE_ROLE_KEY` — same API settings page. This one's a real
     secret (bypasses RLS) — only used locally by the seed script below,
     never committed, never shared in chat.
   - `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` — whatever you want the test
     account's credentials to be; the seed script creates it.
5. **Run the seed script**: `npm run test:seed`. It creates the test account
   directly via Supabase's admin API — no signup form, no email
   confirmation — and marks onboarding as already completed for it. Safe to
   re-run; it reuses the account if it already exists.

`.env.test` is gitignored — it never gets committed.

## Running

```
npm run test:e2e       # headless
npm run test:e2e:ui    # interactive UI mode, easier for writing/debugging
```

The `setup` project (`auth.setup.ts`) logs in once and saves the session to
`e2e/.auth/` (also gitignored); every other test reuses it instead of
logging in from scratch.

## Writing new specs

- Prefer `getByRole` / `getByLabel` over CSS selectors — more resistant to
  markup changes, and it nudges the app's own accessibility forward (form
  fields need a real `htmlFor`/`id` pair to be labelable this way; most of
  the app doesn't have that yet, `ExpenseForm` was the first one fixed).
- Any spec that creates data should clean up after itself (delete what it
  created) so repeated runs don't pile up junk in the test project.
