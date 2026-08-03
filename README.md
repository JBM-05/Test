# Frontend Bundle Builder

An interview take-home implementation of a responsive, four-step security-system bundle builder. The app is a client-only React prototype with a live order review, per-variant quantities, explicit save-for-later persistence, and accessible keyboard interactions.

## Run from a clean clone

### Prerequisites

- [Node.js](https://nodejs.org/) 22 (the exact project version is in `.nvmrc`)
- npm, included with Node.js

```bash
git clone https://github.com/JBM-05/frontend-bundle-builder.git
cd frontend-bundle-builder
nvm use
npm ci
npm run dev
```

Vite prints the local development URL after startup. To exercise the production output locally:

```bash
npm run build
npm run preview
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server with HMR. |
| `npm run build` | Type-check and create the production build. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run test:run` | Run the Vitest unit and integration suite once. |
| `npm run test:coverage` | Run Vitest and produce a coverage report. |
| `npm run e2e` | Run the Playwright browser suite. |
| `npm run check` | Run the complete CI verification sequence. |

Install Playwright's Chromium binary before the first local browser run:

```bash
npx playwright install chromium
npm run e2e
```

## Product and architecture decisions

- **One source of truth.** A pure reducer owns only the open accordion step, active variant per product, and quantity per SKU. Review lines, selected counts, and monetary totals are selectors derived from that state.
- **Data-driven UI.** Ordered steps, products, variants, integer-cent prices, display metadata, and the seeded configuration live in the local bundle catalog. Components render the catalog rather than defining product-specific markup.
- **Variant-safe quantities.** Each variant has a stable SKU and independent quantity. Changing the active color changes which quantity the product-card stepper edits without discarding the other variants.
- **Domain invariants at the state boundary.** Counts cannot become negative, the plan is binary, and selecting a motion sensor adds the required Sense Hub. Removing all motion sensors removes that hub.
- **Client-only by design.** There is no router, commerce backend, or payment integration. Checkout opens a confirmation dialog so the prototype remains focused on configuration behavior.
- **Local assets and predictable rendering.** Product images were exported or downloaded from official Wyze product pages, then resized and compressed before being committed locally. The app avoids runtime third-party image requests and unnecessary transfer cost while retaining deterministic rendering.

Feature code is grouped under `src/features/bundle-builder/`, with catalog/domain code kept separate from persistence, presentation components, and animation hooks. This keeps pricing and selection rules testable without rendering React and keeps framework details out of the core state transitions.

## Save-for-later behavior

Persistence is intentionally explicit. Editing the bundle does **not** write automatically; activating **Save my system for later** stores a versioned snapshot in `localStorage` under `wyze-bundle-builder:v1`. The snapshot includes quantities, active variants, and the accordion state.

Hydration accepts only the current schema/catalog versions and known product, variant, and step identifiers. Invalid, stale, malformed, or inaccessible storage falls back to the Figma seed. This makes schema changes safe and prevents corrupted browser data from breaking the builder.

## Accessibility and motion

- Accordion headers are native buttons following the WAI-ARIA accordion pattern, with labelled regions and programmatic focus when advancing.
- Variant choices are radio groups; quantity controls have contextual accessible names and disabled states; status changes are announced through a polite live region.
- Learn More and Checkout use modal-dialog semantics, support Escape, trap focus while open, and restore focus to the trigger on close.
- Interactive targets remain usable at phone widths, focus indicators are visible, and state is not communicated by color alone.
- GSAP is limited to presentational accordion, card, review-line, total, and dialog transitions. React state and ARIA remain authoritative. `prefers-reduced-motion` resolves animations directly to their final state.

The automated suite currently includes 18 Vitest unit/integration tests for reducer, selector, persistence, and React interaction behavior, plus Playwright flows at desktop/tablet/phone widths, axe accessibility checks, and committed visual baselines for the authoritative Figma viewports. GitHub Actions installs from the lockfile and runs the same `npm run check` command used locally.

Coverage gates are enforced at 80% for statements, functions, and lines and 75% for branches. The final verified run reports 83.59% statement coverage and 86.47% line coverage. A production Lighthouse audit scored 90 for Performance and 100 for Accessibility, Best Practices, and SEO; these scores describe that audited environment and are not treated as permanent guarantees.

## Design references

- [Desktop reference - Figma node 68:9663](https://www.figma.com/design/JYf61etQVqeseX7oY5alGz/Frontend-Test-Figma?node-id=68-9663)
- [Mobile reference - Figma node 74:19845](https://www.figma.com/design/JYf61etQVqeseX7oY5alGz/Frontend-Test-Figma?node-id=74-19845)
- [Responsive inspiration - Figma node 70:14135](https://www.figma.com/design/JYf61etQVqeseX7oY5alGz/Frontend-Test-Figma?node-id=70-14135)

The desktop and mobile nodes are the fidelity targets. The intermediate node is responsive guidance rather than a pixel-perfect target. Figma access was view-only, so structured layer inspection and direct design-token extraction were unavailable; measurements and visual decisions were reproduced from the rendered frames. The responsive implementation therefore prioritizes fidelity at the supplied target sizes and coherent behavior between them.
