# BudgetFlow Frontend Design Plan

Decided 2026-08-09, ahead of pre-launch feature/design work.

## Context

Competitive research (ChatGPT-assisted, cross-checked against Claude's own competitor list) confirmed the right comps to look at: Bonsai, Wave, FreshBooks, HoneyBook, Found, Lili for freelancer-finance tooling; Copilot Money, Monarch Money, YNAB, Rocket Money for personal-budgeting UI polish. Goal for the frontend pass: make BudgetFlow look "phenomenal, cool, modern" — portfolio-worthy, not just functional — before opening it up to other users.

## Tool choices

All four component libraries below are free/MIT-licensed at the core (verified, not assumed — pricing can drift). Motion sits underneath most of them as the shared animation engine.

| Tool | Role | License | Notes |
|---|---|---|---|
| **Motion** (motion.dev) | Interaction layer across the whole app — modal transitions, hover states, number count-ups, page transitions | Free/MIT core. Paid "Motion+" exists (prebuilt premium templates) — not needed. | React-native, declarative — best fit for state-driven app UI |
| **Kokonut UI** (kokonutui.com) | Actual app components — upload widgets, progress indicators, nav/pricing blocks, dashboard pieces | Free/MIT. Paid "Pro" tier exists — not needed. | Built on Tailwind v4 + shadcn/ui + Motion — matches our stack exactly, copy-paste not npm install |
| **Magic UI** (magicui.design) | Polished "professional SaaS" sections — bento grids, animated text, marquees | Free/MIT | More restrained than Aceternity, works in both light/dark |
| **React Bits** (reactbits.dev) | A la carte customizable effects — text reveals, background effects, cursor interactions | Free/MIT | Grab-bag toolkit, not a cohesive page kit — use for 2-3 standout moments, not whole sections |
| **Bklit UI** (bklit.com) | Dashboard chart/data-viz components — line, area, ring, radar charts | Free/MIT for chart components (their "Studio" playground is proprietary, not needed) | Built on shadcn/ui, composable API. User confirmed the chart components looked great after checking them directly. This means partially replacing Recharts in `SpendingChart`/`CategoryChart`/`IncomeExpenseChart`, not adding alongside it — bigger swap than the others, do as its own focused pass |
| **Aceternity UI** (ui.aceternity.com) | Pre-login marketing/landing page — spotlight cursors, 3D card tilts, glowing borders, parallax hero | Free/MIT | Dark-mode-heavy, dramatic/cinematic — built for marketing pages, not dense app UI |
| **GSAP** (gsap.com) | Reserve — only if the landing page hero wants more scroll-driven drama than Motion alone gives | 100% free now (Webflow made all former Club GreenSock plugins free, April 2025) | Imperative/timeline-based, better for scroll-driven marketing sections than app state UI |

## Known risk: visual cohesion

Four different design teams' opinions (spacing, radius, shadows, animation timing) don't automatically look like one product. Mitigation: treat every component from these libraries as raw code to **reskin into BudgetFlow's existing design tokens** — purple-600 primary, teal-500 accent, `rounded-2xl` cards, existing shadow scale (`shadow-[0_1px_3px_rgba(0,0,0,0.07)]` etc., see `src/index.css` / Tailwind config) — not as drop-in components with their own default styling.

## Color palette (decided 2026-08-09, Option A + Notion category system — will keep evolving)

Base palette leans HoneyBook (Option A from the exploration), with Notion's category/status tag system layered on top instead of inventing new tag colors. This **replaces** the old purple-600/teal-500/`#f8f7ff` identity noted in memory — supersede that when this actually gets implemented.

| Role | Hex | Source |
|---|---|---|
| Primary / CTA | `#142127` | HoneyBook's CTA navy-black |
| Accent / highlight | `#FFFA77` | HoneyBook yellow — sparingly: one signature moment (e.g. Tax Reserve card, a badge), not everywhere |
| Background | `#FAF8F5` | Warm off-white, blended from HoneyBook's `#F4EAE0` |
| Card surface | `#FFFFFF` | Keeps the existing white-card pattern |
| Secondary tint 1 | `#A8D0EF` | HoneyBook soft blue — tags/section backgrounds |
| Secondary tint 2 | `#C7D5D9` | HoneyBook blue-gray — borders/dividers |
| Text heading | `#142127` | |
| Text body | `#33424A` | Softened derivative of the CTA navy |
| Text muted | `#8FA3AB` | Derived from `#C7D5D9` |

**Category/status tags** — Notion's actual 9-color light-mode system (verified hex, text/bg pairs), pastel/muted by nature:
Gray `#787774`/`#F1F1EF` · Brown `#976D57`/`#F3EEEE` · Orange `#CC782F`/`#F8ECDF` · Yellow `#C29343`/`#FAF3DD` · Green `#548164`/`#EEF3ED` · Blue `#487CA5`/`#E9F3F7` · Purple `#8A67AB`/`#F6F3F8` · Pink `#B35488`/`#F9F2F5` · Red `#C4554D`/`#FAECEC`

Suggested status mapping: pending → Yellow, paid → Green, overdue → Red. Expense categories can each get one of the remaining colors (Gray/Brown/Orange/Blue/Purple/Pink) — not finalized, revisit as categories get styled.

## Known scope note

"Aceternity for marketing" = building a **new pre-login landing page** (BudgetFlow currently goes straight to `/login`, no marketing page exists). Treat this as its own feature/build, not a styling pass on existing pages.

## Rollout order

1. ✅ **DONE (2026-08-09, commits `7ae5b18`, `3c05dd9`).** Motion + Kokonut UI on the existing authenticated app — palette applied across the whole app (index.css tokens, category/status color maps, chart hex, all remaining blue/purple sweeps); shared animated `Modal` (src/components/ui/Modal.tsx) replacing all 5 modals; Dashboard stat card count-up + staggered entrance; chart card entrances; Recent Invoices row stagger; Kokonut-inspired polish on Receipts dropzone + StatCard icon hover; same stagger/hover treatment extended to Expenses, Invoices, and Receipts (tab cards, summary pills, table rows, mobile cards, gallery thumbnails).
2. **React Bits effects**, layered in selectively once the base styling feels right — a few standout moments, not a full redesign pass. **In progress.**
3. **Bklit UI chart swap** — replace Recharts in the 3 Dashboard chart components with Bklit UI's composable chart primitives, recolored to the current palette. Own focused pass since it's a real library swap, not additive.
4. **Aceternity-powered landing/marketing page** — separate build, own scope. GSAP available in reserve if the hero section wants extra scroll-driven drama.

## Open items for the next session

- Revisit the ChatGPT competitive-research feature gaps (invoice aging/lifecycle, client-level income tracking, cash flow forecast, consolidated reports view) as a separate feature-planning thread — not part of this design-tooling plan
