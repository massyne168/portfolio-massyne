# MASSYNE — Graphic & Motion Design Portfolio

Official source for [portfolio-massyne.vercel.app](https://portfolio-massyne.vercel.app/).

## Website

A fast, responsive static creative portfolio with an editorial **Cinematic Red** visual direction. No npm build or JavaScript framework is required.

### Main pages

- `index.html` — portrait-led Cinematic Hero 2.0, Curated Works, Gurzil Team branding, Motion, Archive, About / Designer Identity, Contact.
- `project.html?work=<slug>` — a single accessible project-detail template that renders an original artwork case study based on the URL.
- `project-data.js` — the definitive collection of 15 completed case study entries: the 14 completed featured projects and Gurzil Team. The two Coming Soon concepts do not have fake case studies.
- `case-study.js` and `case-study.css` — case-study navigation, full-size original artwork viewer, and responsive layouts.

### Branding & introduction

- The upper-left header branding on the home and project pages uses the original white MASSYNE logo from `images/optimized/logo-1016.webp`, with a lighter mobile variant at `images/optimized/logo-480.webp`.
- `brand-loader.css` / `brand-loader.js` add a clean 0–100% branded intro over 3.45 seconds (roughly 3.8 seconds including fade-out). It runs on **every page load and every browser refresh (F5 / Ctrl+R)**; it no longer caches the intro in session storage.
- **Skip intro** works every time. People using reduced-motion preferences do not see the delayed intro.
- The loader is hidden without JavaScript rather than trapping visitors on a non-functional splash screen.

### Other files

- `style.css` — base responsive design and typography.
- `portfolio-enhancements.css` — cinematic personal-portrait hero, project hover, About and Contact upgrades.
- `script.js` — navigation, the archive filters, preview lightboxes, completed featured-work links, and scroll reveals.
- `curated-3d.css` / `curated-3d.js` — 3D carousel with touch/mouse dragging, Gallery / Grid / Index views, rotating crimson border lights, reduced-motion awareness.
- `images/massyne-portrait-2026.avif` — optimized user-supplied black-and-white portrait used in Hero and About. Older browsers can use the existing fallback asset `assets/massyne-hero-portrait.png`.

## Content preservation

The public portfolio keeps **16 Curated Works cards (14 completed + 2 upcoming)**, **23 Archive pieces**, six playable motion studies, Gurzil Team's original brand gallery, the original PDF, social destinations and contacts.

Do not remove or rename any image/videos referenced by the HTML or `project-data.js` without updating their source paths.

## Updating a project case study

Edit the matching object in `project-data.js`. Use a unique `slug`, original `image` path, `category`, `year`, `focus`, `summary` and optional `gallery`. The detail page generates its title and navigation automatically.

To add a new *completed* featured project, add a `.project` card with `data-case-study="<slug>"` in `index.html` and a matching `project-data.js` entry. Upcoming concepts should stay clearly labeled and non-clickable.

## Accessibility and performance

All artwork uses local media. Main interactions support keyboard controls. A native dialog displays full artwork. Reduced-motion preferences turn off continuous motion and default the 3D gallery to a static view. Carousels and effects pause when outside the viewport. Scroll and drag use lightweight CSS transformations.

## Deployment

Static hosting works on Vercel or any standard static file server. Serve the repository root directly, keeping all `.html`, `.css`, `.js`, `assets/` and `images/` files together.

Deployment does not require a build command.

## Notes

Project copy is an editorial description of the existing artwork; it does not assert unknown client work, production process, project-specific software or fabricated mockups. Additional original process images can be added later to each project's `gallery`.
