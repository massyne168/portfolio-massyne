# MASSYNE — Graphic & Motion Design Portfolio

Official source for [portfolio-massyne.vercel.app](https://portfolio-massyne.vercel.app/).

## Website

A fast, responsive static creative portfolio with an editorial **Cinematic Red** visual direction. No npm build or JavaScript framework is required.

### Main pages

- `index.html` — portrait-led Cinematic Hero 2.0, **21 Curated Works**, Gurzil Team, **Services**, six Motion videos and interactive reel, Archive, About/CV, availability and Contact/Project Brief.
- `projects/<slug>.html` — **20 unique, static, pre-rendered and indexable project pages**, with artwork, concept, visual direction, authentic crops, 3 design observations, original gallery and previous/next navigation.
- `project.html?work=<slug>` — a backwards-compatible dynamic template (marked `noindex` to prevent duplicate search results).
- `project-data.js` — the definitive collection of 20 completed case study entries, each with unique editorial descriptions/visual notes; 19 completed featured projects and Gurzil Team. The two Coming Soon concepts do not have fake case studies.
- `case-study.js`, `case-study.css` and `studio-upgrade.css` — accessible rich case-study navigation, full-size original artwork viewer, responsive concept/details layouts and progressive-enhancement cross-document transitions.

### Branding & introduction

- The **compact** upper-left header branding on the home and project pages uses the original white MASSYNE logo from `images/optimized/logo-1016.webp`, with a lighter mobile variant at `images/optimized/logo-480.webp`.
- `signature-intro-v5.css` and `brand-loader.js` run MASSYNE Signature Fade: uncluttered original-logo / MASSYNE typography and one quiet crimson line, 0.92-second opening and 0.34-second fade, without fake 0–100 resource progress. The intro appears on first home entry or explicit F5, but skips project navigation. Reduced-motion bypass remains.
- **Skip intro** works every time. People using reduced-motion preferences do not see the delayed intro.
- The loader is hidden without JavaScript rather than trapping visitors on a non-functional splash screen.

### Other files

- `style.css` — base responsive design and typography.
- `portfolio-enhancements.css` — cinematic personal-portrait hero, project hover, About and Contact upgrades.
- `script.js` — navigation, the archive filters, preview lightboxes, completed featured-work links, and scroll reveals.
- `curated-3d.css` / `curated-3d.js` — 3D carousel with touch/mouse dragging, Gallery / Grid / Index views, rotating crimson border lights, reduced-motion awareness.
- `assets/massyne-hero-portrait.png` — existing transparent personal portrait used in both Hero and About (the heavily compressed historical AVIF is no longer referenced).

## Studio enhancements (October 2026)

- **Services / What I Do:** four concise offerings linking to real project examples: Poster & Key Art, Visual Identity, Art Direction and Motion Graphics.
- **Project Brief:** a client-side form in Contact that validates required fields and opens an editable `mailto:` message addressed to the existing email. A Copy Brief button offers a clipboard fallback. **No API is configured, nothing is saved on the site, and no email is claimed to be sent** until the visitor sends it from their own email client.
- **Motion Reel:** `studio-upgrade.js` takes the original 6 MP4 motion studies and plays up to 5 seconds from each, in sequence, after a visitor explicitly presses Play. No duplicate edited reel file, third-party package or autoplay with sound. The original six videos remain below the reel and now use `preload="none"` until requested.
- **Navigation transitions:** supported browsers animate matching project artwork between the gallery and static project pages using standard `@view-transition`. The 3D selection behavior is unchanged. A one-use session flag bypasses the intro **only on an intentional project-to-project navigation**, not on refresh. **F5 continues to show the refreshed short entry-only Signature Opening**.
- **SEO:** `sitemap.xml`, `robots.txt`, branded `404.html`, canonical + social metadata and structured data. All 20 case-study pages have content in their HTML before JavaScript executes.
- **Performance:** all six standalone MP4s are lazy-on-interaction (`preload="none"`); original artwork images are lazy where appropriate. `.vercelignore` avoids shipping large legacy ZIPs and local QA caches via Vercel CLI. All original assets stay safely in GitHub.

## Spotlight, Smart Discovery & Related Projects (October 27, 2026)

- **THE SPOTLIGHT** in `index.html` showcases three selected original works as responsive, accessible links to the existing static case studies. Local WebP previews are lazy-loaded and respect reduced-motion settings.
- **Smart Discovery** adds title search and four curated categories in `spotlight-discovery.js`. Filtering switches the existing 3D carousel into its supported Grid view rather than changing the 3D engine. Returning to 3D automatically restores all 22 original cards. Keep the explicit category-to-slug map in sync when adding new works.
- **Related Projects** is generated by the existing `case-study.js` on every static project page. Recommendations are selected from `project-data.js` using shared category and creative-focus terms (with stable collection-order fallback), and link to real case studies; no new project pages or client claims are invented.
- Shared styling lives in `spotlight-discovery.css` and `case-study.css`. No new runtime dependencies, autoplay or third-party assets were introduced.
- **MASSYNE LAB** is now on `main` (merged PR #24): three keyboard-accessible visual experiments (interactive typography, original art and palette previews), with responsive CSS, no continuous animation loop and reduced-motion fallback.
- **Premium case-study breakdown** on every static project page adds a chapter navigation index and creative DNA cards grounded in each project’s real editorial details.
- **Immersive artwork viewer** upgrades the existing native dialog with previous/next work, keyboard arrows, touch swipe, a zoom toggle and links to other real case studies. This shares the existing `case-study.js` and `case-study.css`.
- **Integration:** PR #25 (Spotlight, filters, related projects) and PR #24 (LAB, breakdown, viewer) have both been merged into `main`. Source structure, 3D gallery, original work and introduction flow are retained; browser visual QA remains advisable after deployments.

## Updating case studies

Edit `project-data.js` first; the script populates the legacy template and the 20 pre-rendered HTML snapshots. When you change a project title, summary, images or design notes, **regenerate the matching `projects/<slug>.html` snapshot** so SEO HTML stays in sync. Current snapshots are deliberately static rather than relying on browser-only rendering.

## Next-Level portfolio presentation — October 18, 2026

- **Artwork presentation:** Per latest feedback, the additional mockup showroom was removed. Real artwork appears in 21 Curated Works cards and the original art viewer/gallery on each of 20 completed case-study pages.
- **Creative interactions:** `next-level.css` / `next-level.js` add small (≤5px), reduced-motion-aware pointer reactions on selected CTAs, plus optional IntersectionObserver section reveals; never override the 3D carousel or the entry-only Signature Opening v3.
- **Professional resume:** `resume.html` is a readable accessible CV plus **Print / Save as PDF**; `assets/MASSYNE-Resume.pdf` is a **5,914-byte 1-page PDF** with real portfolio links and existing contact details. No unknown degrees, employment years or languages are invented. Download links are in the About section.
- **Availability:** `availability.js` is the one-file status control: `inquiries`, `open`, `limited`, or `closed`. Defaults to neutral **OPEN FOR CREATIVE INQUIRIES**; do not mark the designer as booked or available without confirmation. Status appears in Hero and Contact.
- **Privacy-aware analytics:** `portfolio-analytics.js` progressively injects Vercel Web Analytics and Speed Insights in Vercel production only, and optionally sends generic project/CV/contact/showreel category events (no email, form text or visitor identifiers). **Dashboard activation remains required** to see metrics. Custom events may require a paid Vercel plan.
- **Performance changes:** 9 Curated Work cards now use existing responsive WebP sources, all 23 Archive images decode asynchronously with low fetch priority, and original project images use lazy loading. Original files/media retained. See [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) for verified media sizes and remaining manual work.

## October 18 — Final Art-Object Presentation

Five user-supplied original designs were added as WebP originals plus 420px mobile previews: GLORY, NOCTURNE — RED SUN, ENVY, NOCTURNE — DARK VEIL and THE LAST OATH. These five appear in the 3D Curated Works gallery and have original case studies with unique descriptions, concept, art direction, three detail observations and source artwork.

- The homepage contains 21 Curated Works cards: 19 finished pieces and 2 clearly marked upcoming concepts. Gurzil Team remains a separate branded case study, making 20 published case-study pages.
- The former three-card mockup display was replaced with a 20-project artwork showroom. The latest Grand Gallery direction standardizes every completed project into one large glass-framed tableau, with no garment view or fake printed product. These are digital concept visualizations, not claims of client production.
- Art assets are stored under images/curated/ in optimized full and 420px WebP formats. Case studies and home cards use lazy loading as appropriate.
- The new visual Signature Opening lasts approximately 1.88 seconds, runs on initial external entry and browser F5/reload, and never replays on normal same-site navigation between works. Reduced-motion preferences bypass it entirely.

## Content preservation

The public portfolio keeps **21 Curated Works cards (19 completed + 2 upcoming)**, **23 Archive pieces**, six playable motion studies, Gurzil Team's original brand gallery, the original PDF, social destinations and contacts.

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

## October 19 — Requested visual simplification

- Removed the entire additional grand-glass-frame mockup exhibition from the homepage, and removed the additional museum-presentation section from all 20 static case studies and the legacy dynamic case-study page. Original artwork, metadata, galleries, 21 curated cards and all other site sections are preserved.
- Introduced `signature-intro-v5.css` — a completely new, calm typography-first opening with the white MASSYNE name, small logo, crimson punctuation, fine timed accent rule, and a working Skip Intro. No percentage counter or fake resource progress.
- `brand-loader.js` now guarantees **no loading overlay on ordinary project-page navigation**, including when storage and referrer are unavailable; **F5 or Refresh** intentionally replays it. Reduced-motion visitors skip it.
- Smoothed 3D carousel transitions by shifting the movement to transform/opacity, turning off expensive continuous image/border animation in 3D, and retaining immediate live pointer dragging with eased settling on release. Grid/Index, swipe, keyboard navigation, Coming Soon and autoplay remain available.
- Historical mockup/loader files are not linked from pages and may remain in source history for recovery; original artwork is never deleted.


## Adding mockup projects

The Curated Works **Mockups** filter groups original T-shirt, hoodie and other mockup projects. Until original mockups are added, it displays an empty state; existing artwork is not reclassified or replaced.

For each new completed mockup, add its original image to `images/`, create its project page and matching `project-data.js` entry using the existing project structure, and add a `.project` card to `index.html` with `data-case-study="<slug>"` and `data-discover-categories="mockups"`. Multiple categories may be separated by spaces, e.g. `data-discover-categories="mockups identity"`. Include T-shirt / Hoodie / Mockup in the card title or category caption so visitors can search by garment type. Update the gallery totals and search placeholder when adding cards. No hardcoded filter catalog edit is needed for tagged cards.
