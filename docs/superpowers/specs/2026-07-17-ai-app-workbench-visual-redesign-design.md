# AI App Workbench Visual Redesign

## Goal

Unify the Vue frontend around the supplied reference's product-workbench visual language while preserving every existing route, API request, store, permission check, form validation, and application-generation workflow.

## Reference DNA

- Light neutral paper and a restrained ink hierarchy.
- A compact, framed navigation bar with one clear primary action.
- A homepage-specific cyan-to-blue textured color field behind the centered prompt composer.
- A white work gallery that rises from the hero boundary instead of a stack of floating cards.
- Soft geometric sans-serif typography, generous homepage whitespace, and denser operational views.
- Fine neutral rules, low-elevation surfaces, and one cyan-blue accent system.

The implementation will not reuse the reference's name, logo, copy, iconography, or source imagery. The homepage color field will use an original CSS treatment; the rest of the app uses neutral surfaces to keep data-heavy and chat workflows legible.

## Visual System

### Tokens

`ai-coding-front/tokens.css` remains the single source of visual values. It defines paper, ink, muted text, rules, panel surfaces, cyan-blue action colors, status colors, shadows, radii, spacing, typography, timing, and focus styling. Components must consume named tokens instead of local hex values or locally invented gradients.

### Shared Chrome

`BasicLayout`, `GlobalHeader`, and `GlobalFooter` form a consistent framed shell on standard routes. The header uses a quiet off-white panel, hairline border, product mark, short navigation, and compact account controls. The footer becomes a simple quiet closing band without animated decoration. Immersive chat remains full height but inherits the same neutral surface, rule, controls, and accent colors.

### Homepage

The home route is the only route with the full cyan-blue color field. It places the headline and large prompt composer at the center, retains the existing suggestion actions, and moves both application collections into a wide white gallery surface with a curved top edge. Application cards read as gallery tiles, not stacked dashboard cards.

### Form and Authentication Views

Login, registration, and application editing use a calm light canvas, tightly framed forms, a small route label, explicit form hierarchy, and the shared control states. Existing fields, validation errors, redirects, and submit behavior stay unchanged.

### Operational Views

User and application management pages retain their filters, tables, drawers, and pagination. The redesign uses a compact title band, a single structured query surface, dense table rules, and responsive vertical stacking rather than promotional layout patterns.

### Generation Workbench

The chat route keeps its split chat-and-preview interaction model. The topbar, chat panel, message bubbles, composer, and preview toolbar share the new rule/panel system. The generation state remains visible through text, loading states, and a restrained accent rather than decorative animation.

## Responsive and Accessibility Requirements

- Verify the standard routes at 320, 375, 414, and 768 pixel viewport widths.
- Do not introduce horizontal scrolling. Image-bearing grid tracks use `minmax(0, 1fr)`.
- Keep headers, headings, long app names, filter controls, and action buttons within their containers.
- Keep all existing `aria-label` values and add visible focus rings through the global token system.
- Use transform and opacity only for optional transitions. Respect `prefers-reduced-motion`.

## Scope

The redesign covers every existing frontend route and their shared visual components:

- Standard shell, header, footer, homepage, login, register, about.
- User and app management, user modal/drawer, app editor, app drawer.
- App gallery cards, search sections, prompt composer, chat messages, preview panel, immersive generation workbench.

It excludes backend endpoints, data shapes, router contracts, user roles, generated application content, and unrelated refactors.

## Verification

- Run all existing Vitest tests.
- Run Vue type checking and production build.
- Inspect the running Vite app at desktop and mobile widths, including homepage, auth, management, app edit, and chat layouts.
- Confirm route behavior and API service modules are unchanged by reviewing the final diff.
