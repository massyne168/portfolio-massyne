# MASSYNE portfolio

Complete static website redesign. Open index.html in a browser, or serve this folder using any static web server. No package installation or compilation is required. Deploy index.html, style.css, script.js, assets/ and images/ together.

## Design and behavior
Editorial art-book direction: oversized MASSYNE masthead, warm paper and ink with vermilion accents, an angled Veiled Sorrow hero study, a consistent three-column desktop gallery and two-column mobile gallery with uncropped 4:3 media frames. Brief artwork entrance and one-time scroll reveals respect reduced-motion preferences. Native image previews, archive filters, mobile navigation and click-to-play videos remain. No animation library, font download or continuous animation loop.

All existing project image files, six motion videos, portfolio PDF, social and contact destinations are retained. Existing project cards labeled as upcoming are retained as supplied. Empty restaurant coming-soon cards, sample testimonial, live counters and decorative loading screens were removed from the active page. Legacy private-preview gating is not loaded by this redesigned entry page. No deployment was performed.

## Validation
Executed in headless Chrome, including actual device emulation at 320px and 390px and desktop at 1440px. Checks passed for horizontal overflow, navigation targets, archive filtering, preview opening/next/closing, mobile menu state, and six playable video controls. Local asset references resolve. Desktop and mobile screenshots were visually reviewed. This static site has no build command.

## Asset note
The hero now features existing Veiled Sorrow artwork. The previous portrait asset remains on disk but is not loaded. No replacement project artwork was generated.

The Behance reference returned HTTP 403 in the available fetch tool, so the redesign follows the requested bold typography, energetic composition and strong hierarchy without claiming a direct visual match.

## Files
- index.html: complete page and existing portfolio content
- style.css: full responsive design
- script.js: menu, filters, image previews and video controls
- images/ and assets/: original media and PDF
- api/: existing optional endpoints, unchanged

The original entry files are backed up locally under .codex-tmp/redesign-backup (excluded from delivery ZIP). Existing legacy hero/lock files remain in the working directory but are not used by the redesigned site.

## Editorial refinement validation
Chrome checks passed at 320px, 390px and 1440px for navigation, filters, image previews, mobile menu and six video controls. Desktop and mobile hero/project screenshots were visually reviewed. Narrow heading overflow was corrected using client-width checks. Existing delivery ZIP predates this refinement; deploy the source files listed above.

## Motion and graphic details
Print registration corners and orbit dividers extend the editorial identity. A short page entrance, one-time heading reveals, local preview/filter transitions, and fine-pointer project hovers use native CSS/Web Animations. Artwork remains visible without JavaScript. Desktop image drift is bounded to 7px, observes only visible images, batches geometry reads before writes, and schedules frames only in response to scroll/resize. Touch layouts keep images stationary. Live reduced-motion changes cancel animations, reset drift and disable smooth scrolling. No dependencies or media were added.

Chrome validation passed at 320px, 390px and 1440px: no horizontal overflow, navigation, filters, previews, mobile menu, and six video controls. Live reduced-motion checks confirmed zero running animations, zero observed drift targets, cleared drift styles, and automatic scroll behavior.

## Curated gallery refinement
All 16 selected pieces, 23 archive studies, four brand visuals, the brand logo and six motion clips are retained. Asset-reference comparison found no removals. Added collection jump navigation and visible captions to archive, brand and motion cards; untitled archive items use neutral category/study numbers. Shared frame proportions, tighter spacing and responsive typography shorten browsing without hiding projects. Browser checks passed at 320, 390, 768 and 1440px for overflow, navigation, filters, previews and reduced motion. Desktop and phone gallery screenshots were visually reviewed; caption alignment and frame sizing were refined afterward. Source files are current; the existing ZIP predates these refinements.
