# MASSYNE — Graphic & Motion Design Portfolio

Official source for [portfolio-massyne.vercel.app](https://portfolio-massyne.vercel.app/).

## Website

A fast, responsive static creative portfolio with an editorial **Cinematic Red** visual direction. No npm build or JavaScript framework is required.

### Main pages

- `index.html` — portrait-led Cinematic Hero 2.0, **21 Curated Works**, Gurzil Team, **Services**, **20-project artwork-first editorial Studio Showcase**, six Motion videos and interactive reel, Archive, About/CV, availability and Contact/Project Brief.
- `projects/<slug>.html` — **20 unique, static, pre-rendered and indexable project pages**, with artwork, concept, visual direction, authentic crops, 3 design observations, original gallery and previous/next navigation.
- `project.html?work=<slug>` — a backwards-compatible dynamic template (marked `noindex` to prevent duplicate search results).
- `project-data.js` — the definitive collection of 20 completed case study entries, each with unique editorial descriptions/visual notes; 19 completed featured projects and Gurzil Team. The two Coming Soon concepts do not have fake case studies.
- `case-study.js`, `case-study.css` and `studio-upgrade.css` — accessible rich case-study navigation, full-size original artwork viewer, responsive concept/details layouts and progressive-enhancement cross-document transitions.

### Branding & introduction

- The **compact** upper-left header branding on the home and project pages uses the original white MASSYNE logo from `images/optimized/logo-1016.webp`, with a lighter mobile variant at `images/optimized/logo-480.webp`.
- `signature-intro-v3.css` and `brand-loader.js` now run the new MASSYNE Signature Opening: expressive typography, editorial red accents, a minimal progress line, Skip Intro and a 1.12-second progress and 0.35-second exit. It runs only on first tab entry or an explicit F5/Refresh; navigation between portfolio projects skips it. Reduced-motion bypass remains. Previous unused loader CSS remains archived but is not used.
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

## Updating case studies

Edit `project-data.js` first; the script populates the legacy template and the 20 pre-rendered HTML snapshots. When you change a project title, summary, images or design notes, **regenerate the matching `projects/<slug>.html` snapshot** so SEO HTML stays in sync. Current snapshots are deliberately static rather than relying on browser-only rendering.

## Next-Level portfolio presentation — October 18, 2026

- **Art-object presentation:** `index.html#presentation` contains one generous editorial stage, all 20 completed artworks in an accessible thumbnail rail, and Gallery Frame / Textile Study / Original Artwork modes. The five new cinematic designs are preserved. The 20 case-study pages use two deliberate presentations, not synthetic hoodie illustrations.
- **Creative interactions:** `next-level.css` / `next-level.js` add small (≤5px), reduced-motion-aware pointer reactions on selected CTAs, plus optional IntersectionObserver section reveals; never override the 3D carousel or the entry-only Signature Opening v3.
- **Professional resume:** `resume.html` is a readable accessible CV plus **Print / Save as PDF**; `assets/MASSYNE-Resume.pdf` is a **5,914-byte 1-page PDF** with real portfolio links and existing contact details. No unknown degrees, employment years or languages are invented. Download links are in the About section.
- **Availability:** `availability.js` is the one-file status control: `inquiries`, `open`, `limited`, or `closed`. Defaults to neutral **OPEN FOR CREATIVE INQUIRIES**; do not mark the designer as booked or available without confirmation. Status appears in Hero and Contact.
- **Privacy-aware analytics:** `portfolio-analytics.js` progressively injects Vercel Web Analytics and Speed Insights in Vercel production only, and optionally sends generic project/CV/contact/showreel category events (no email, form text or visitor identifiers). **Dashboard activation remains required** to see metrics. Custom events may require a paid Vercel plan.
- **Performance changes:** 9 Curated Work cards now use existing responsive WebP sources, all 23 Archive images decode asynchronously with low fetch priority, and the new mockup assets use lazy loading. Original files/media retained. See [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) for verified media sizes and remaining manual work.

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

## Grand Gallery and Opening Frame 04 — October 18

**The user's most recent visual direction takes priority:** all 20 completed artwork case studies are displayed in one **identical, large museum-style glass frame**, rather than a mixed grid of tiny frames, pseudo-hoodie cards and assorted shapes.

- The homepage `#presentation` exhibition shows a **single enormous 4:5 glass frame** on a gallery wall, with a horizontal rail for choosing any of the **20 original completed artworks**. The original designs remain intact and use `object-fit:contain` in the same-sized mat: no cropping or stretching when the image dimensions vary. A details panel links to each full Case Study.
- Every `projects/<slug>.html` file (20 total) and legacy `project.html` use the exact same `museum-case` gallery section and CSS. A single large, consistent glass frame replaces the previous side-by-side small print and textile mockups. Original artwork images and galleries are preserved.
- `grand-gallery.css` implements the uniform 4:5 museum frames, faux glass reflection, consistent large wall stages and compact, readable mobile dimensions without new image downloads. These frames are clearly described as digital mockups, not physical client installations.
- The old garment and original-art modes are intentionally removed from the homepage showroom after the user requested **only one large gallery painting format**. The original art remains inspectable in the full Case Study artwork viewer and original galleries.
- `atelier-gallery.js` retains direct user project switching and keyboard navigation without automatically scrolling to the showroom on site load.
- The new `studio-entry.css` is **Opening Frame 04**: a distinct modern graphic-studio intro featuring MASSYNE's official logo, large cut typography, subtle red lines and responsive 0–100 progress. It replaces the former Signature Index style in the homepage, legacy case template and 20 static case studies.
- The original `brand-loader.js` logic is preserved: show the intro on **first entry per tab** and explicit F5/Refresh; **do not replay** during normal internal navigation between projects or browser back/forward. Also respects Skip, reduced-motion and 1.12s progress + 0.35s exit.
- **Preserved:** 21 Curated Works cards (19 completed + 2 upcoming), all five newly uploaded artworks, 20 completed case-study pages including Gurzil Team, 23 Archive works, six original motion clips, red/black theme, portrait, 3D drag carousel, Contact, CV, Services and SEO.

