---
name: massyne-uiux-design
description: >-
  Comprehensive UI/UX design workflow for the MASSYNE portfolio. Covers premium
  aesthetic enforcement, mobile-first responsive layout, typography system,
  gallery and project presentation, smooth motion design, accessibility, and
  performance-conscious styling. Always inspects existing code before proposing
  changes. Activate when reviewing, designing, or refining any visual or
  interactive aspect of the MASSYNE site.
---

# MASSYNE UI/UX Design Skill

This skill governs every design decision made on the MASSYNE portfolio.
Read it in full before proposing any visual, layout, or interaction change.

---

## 1. Project Context

| Item | Value |
|---|---|
| Local path | `S:\Projects\portfolio-massyne` |
| Stack | Vanilla HTML5 / CSS3 / ES6+, zero-build |
| Hosting | Vercel (static + serverless) |
| Primary CSS files | `style.css`, `section-nav.css`, `mobile-nav.css`, `portfolio-enhancements.css`, `sections-art-direction.css`, `curated-3d.css`, `before-after.css` |
| Primary JS files | `section-nav.js`, `parallax-bg.js` |
| Entry point | `index.html` |

---

## 2. The MASSYNE Aesthetic System

### Colour Palette

| Role | Value | Usage |
|---|---|---|
| Background (primary) | `#0a0a0a` / `#000000` | Page and section backgrounds |
| Crimson Red (accent) | `#C0392B` / `#E74C3C` | CTAs, highlights, active states, decorative lines |
| Silver / Light Grey | `#C0C0C0` / `#A0A0A0` / `#E8E8E8` | Body text, secondary labels, borders |
| White | `#FFFFFF` | Headings, high-contrast elements |
| Mid-tone dark | `#111111` / `#1a1a1a` | Card and panel backgrounds |

**Rule:** Never introduce new brand colours. All UI proposals must map to the
palette above. Any red used must be a shade of `#C0392B`–`#E74C3C`. Avoid
pure blue, green, or purple accents — they break the cinematic identity.

### Typography

| Role | Typeface | Weight | Style |
|---|---|---|---|
| Display / Wordmark | Serif (Georgia fallback) | 700 | Uppercase, wide letter-spacing |
| Section headings | Serif | 600–700 | Mixed case, tight leading |
| Body / descriptions | Sans-serif | 300–400 | Comfortable line-height ≥1.6 |
| Labels / captions | Monospace or sans-serif | 400 | Uppercase, tracked 0.1–0.2em |
| Navigation items | Sans-serif | 500 | Uppercase, tracked 0.08em |

**Rule:** Always check which fonts are already loaded in `index.html` before
proposing a new typeface. Never add a font that is not already in the project.
If a typographic improvement is needed, achieve it through weight, size, spacing,
and colour — not new typefaces.

### Visual Principles

- **Negative space is intentional.** Generous padding amplifies the premium feel.
- **Crimson details act as focal anchors.** Use them sparingly — a single accent
  element per section is usually enough.
- **Layered depth.** Subtle shadows, slight text-shadows on headings, and
  translucent overlays create depth without competing with the content.
- **Motion serves the story.** Animations should feel cinematic and purposeful —
  not decorative or distracting.

---

## 3. Mobile-First Responsive Design Protocol

### Breakpoints

| Label | Width | Priority |
|---|---|---|
| Small mobile | 320–374 px | Nice-to-have |
| Mobile (primary) | 375–430 px | **Critical** |
| Large mobile | 431–767 px | High |
| Tablet | 768–849 px | High |
| Desktop trigger | 851 px+ | Existing behaviour |

**The `section-nav.js` mobile query is `max-width: 850px`.** Any CSS
media query that affects the panel/section layout must use `850px` as the
breakpoint threshold to match JS behaviour exactly.

### Mandatory Inspection Steps (before any CSS change)

1. Read `section-nav.css` lines around `[data-panel-section]` — check
   for `position: absolute` rules applied under `.section-view-ready`.
2. Read `mobile-nav.css` — confirm it is linked in `index.html`; if not,
   this is a critical bug (the missing link is the primary cause of mobile
   overflow).
3. Read `section-nav.js` — trace `applyPanelVisibility()` and `activate()`
   to understand what classes and `hidden` attributes are set at each breakpoint.
4. Use PowerShell `Select-String` to find every media query in every CSS file
   before proposing new ones.
5. Test logic at 375 px, 390 px, 430 px, and 768 px.

### Layout Rules on Mobile

- All sections (`[data-panel-section]`) must have `position: relative` and
  `height: auto` on screens ≤850 px.
- `overflow-x: hidden` on `body` and `html` to prevent horizontal scrolling.
- Touch targets must be ≥44 × 44 px.
- Bottom navigation rail buttons: use `font-size: clamp(9px, 2.2vw, 11px)` and
  `flex-wrap: wrap` or a scrollable container if 9+ items do not fit at 375 px.
- Hamburger / mobile menu: must be visible and functional on mobile — check that
  `section-nav.css` does not hide it with `display: none`.

---

## 4. Section Architecture

The MASSYNE portfolio has 9 panel sections in this order:

1. `home-panel` — Hero / Wordmark
2. `work` — Case studies / gallery
3. `process` — Design process
4. `identity` — Brand identity work
5. `motion` — Motion design reel
6. `creative-lab` — Experimental work
7. `archive` — Historical projects
8. `services` — Service offering
9. `contact` — Contact form + footer

**Never reorder sections** without explicit approval. Never rename
`data-panel-section` keys — JS and CSS depend on them.

---

## 5. Gallery and Project Presentation Standards

- Project thumbnails: minimum 800 × 600 px displayed, source at 2× for retina.
- Always use `loading="lazy"` on below-fold images.
- Gallery grids: prefer CSS Grid with `auto-fill` / `minmax()` for fluid columns.
- Project detail pages: hero image must span full viewport width on mobile.
- Before/after sliders (`before-after.css`): confirm they remain functional on
  touch devices — check for `pointer` and `touch` event listeners.

---

## 6. Motion & Interaction Design Rules

- **Entrance animations:** prefer `opacity` + `transform: translateY()` fades.
  Use `IntersectionObserver` with `threshold: 0.15` for scroll-triggered reveals.
- **Transition durations:** UI hover = 200–300 ms. Section transitions = 500–800 ms.
  Never exceed 1000 ms for a UI micro-interaction.
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard) or
  `ease-in-out` for section moves. `ease-out` for entrances.
- **Parallax (`parallax-bg.js`):** Confirm it is disabled / degraded on mobile
  (`prefers-reduced-motion` media query + a `mobileFlowQuery.matches` guard).
- **Reduced motion:** All motion must be disabled or minimised when
  `prefers-reduced-motion: reduce` is set. This is non-negotiable.
- **JavaScript animations:** Prefer `requestAnimationFrame`. Never use
  `setInterval` for visual animation.

---

## 7. Accessibility Checklist

Before marking any design change complete, verify:

- [ ] Colour contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for large text.
- [ ] All interactive elements have visible focus styles (`outline` or custom).
- [ ] Images have descriptive `alt` text (not empty unless purely decorative).
- [ ] `aria-hidden="true"` is set on decorative SVGs and icons.
- [ ] Hidden panels use `hidden` attribute and `aria-hidden="true"`.
- [ ] Form inputs have associated `<label>` elements.
- [ ] Skip-to-content link is present and functional.
- [ ] Keyboard navigation order is logical.
- [ ] Reduced-motion preference is respected.

---

## 8. Performance Rules

- Target Lighthouse score: Performance ≥ 90, Accessibility ≥ 90.
- **Images:** Provide `width` and `height` attributes to prevent layout shift.
  Use WebP with JPEG fallback. Compress images to ≤ 200 KB for thumbnails,
  ≤ 500 KB for hero images.
- **CSS:** Keep specificity low. Prefer class selectors. Avoid `!important`
  except when overriding third-party or framework rules — in which case document
  the reason in a comment.
- **JavaScript:** Defer non-critical scripts. Keep the main thread clear of
  long tasks (>50 ms).
- **Fonts:** Use `font-display: swap`. Subset fonts to the characters used.
- **No new external dependencies** may be added without explicit approval.

---

## 9. Workflow Protocol

### Before Any Change

1. Read `AGENTS.md` at the repository root.
2. Inspect the target file(s) in full.
3. Use `Select-String` or `node` scripts to trace all references.
4. Document the current state.
5. Propose the change and wait for approval if the scope is large.

### After Any Change

1. Run `node --check <file>` for JS changes.
2. Run `Select-String` to verify no duplicate or conflicting rules exist.
3. List every modified file with a before/after diff summary.
4. Report to the user; do not proceed to the next phase without approval.

### Never

- Commit, push, or deploy without explicit approval.
- Delete or rename assets without explicit approval.
- Introduce external API keys or paid services.
- Modify `AGENTS.md`.
- Make unrelated design changes (strict scope discipline).
