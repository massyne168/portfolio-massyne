# MASSYNE — Performance & Analytics Audit
Audited: 2026-10-18 · Repository: massyne168/portfolio-massyne
Scope: static source, media sizes, progressive enhancements, and instrumentation.
This report is **not** a live Lighthouse/PageSpeed benchmark and does not invent visitor counts.

## Repository privacy and deployment hygiene — verified 2026-10-18

- The **public GitHub repository** accidentally contained a committed `.codex-tmp/` folder with ~1,400 automated Chromium test/runtime files. Some files had browser-profile names such as `Cookies`, `Login Data`, and `History`. **No credential content was inspected or reproduced in this audit.**
- This maintenance change removes **only that temporary directory from the current tracked tree** and adds `.gitignore` rules to discourage it from being committed again. All original artwork, 3D, site content, PDFs, JS/CSS, projects and design ZIPs stay in the repository.
- **Git history still retains older commits containing these files.** Removing a folder from HEAD does not scrub them from previous public commits, forks, caches, or clones. As repository owner, assess whether any real sessions/secrets could have been exposed, invalidate affected sessions/tokens if appropriate, and plan a separate coordinated Git history cleanup with collaborators.
- This is a repository privacy/security improvement; it does **not** claim a measured Core Web Vitals speed increase, though it reduces the working-tree footprint and avoids accidental redeployment of temporary browser profiles.

## October 18 update — 21 works and realistic mockup system
- Five user-supplied source posters were added in optimized full and 420px WebP renditions. Source previews are cropped to the original poster bounds, removing only the surrounding blurred screenshot background.
- 21 Curated Works cards now represent 19 completed pieces and two upcoming entries. The independent Gurzil Team case study gives a total of 20 completed case-study pages.
- The new 20-project mockup showroom offers Studio Mix, Glass Frames and Hoodies/T-shirts; case-study pages show two framed/wearable original-artwork concepts each. The five new works include additional editorial renders clearly marked as concepts.
- The Signature Opening was replaced with a lightweight 1.88-second typography-focused design. It appears only on first external entry and explicit F5/Reload, not internal navigation. No actual Lighthouse metrics have been measured; preserve this distinction.

## Delivered optimizations
- Preserved responsive 3D gallery, Signature Sequence loader, existing 21 Curated Works (19 completed + 2 upcoming), 23 Archive works, and original six MP4s.
- Added responsive `srcset` / `sizes` to **nine** featured artwork images with verified existing 480px, 800px, 1200px and 1400px WebP renditions. Small devices should download a correspondingly smaller rendition.
- All 23 archive images have `loading="lazy"`, `decoding="async"`, and `fetchpriority="low"`. Their paint is eligible for CSS `content-visibility:auto` where supported.
- Motion-video tiles continue to use `preload="none"`; interactive showreel does not preload six MP4s automatically.
- Homepage presentation mockups reuse existing artwork URLs. All 15 case-study mockups reuse the same original artwork URLs and are lazily loaded. No new heavy image libraries/files.
- Magnetic pointer effects are limited to fine pointers, capped at 5px, and use one animation frame per burst. Reduced motion disables them; no custom cursor or continuous page-wide animation was added.
- Added a **5,914-byte, 1-page vector resume PDF** rather than duplicating the ~30MB artwork portfolio.
- `portfolio-analytics.js` and scripts load after page load / idle on Vercel domains, to avoid delaying critical rendering. No analytics script is injected during local development.
- New `resume.html` and case-study routes use normal HTML links with printable styling rather than heavyweight PDF-building JavaScript.

## Measured repository hotspots (source Git blob sizes)
| Item | Approximate size | Action |
| --- | ---: | --- |
| `images/archive28.webp` | 5.93 MiB | Still needs manual high-quality image optimization |
| `images/archive8.webp` | 2.76 MiB | Lazy and low-priority now; optimize file when artwork fidelity can be reviewed |
| `images/archive16.webp` | 2.65 MiB | Same |
| `images/archive14.webp` | 2.62 MiB | Same |
| `images/archive17.webp` | 1.44 MiB | Same |
| `images/massyne-portfolio.pdf` | 30.76 MiB | Kept intact by design, optional separate PDF optimization |
| `assets/MASSYNE-Resume.pdf` | **0.0056 MiB** | New light CV download |
| Six original motion MP4s | ~2.17 MiB combined | Remain on-demand |
| Three old design ZIPs in repository | ~204.7 MiB combined | Do not delete without user request; excluded from Vercel CLI via existing `.vercelignore` |

**Important:** file sizes alone are not the downloaded page weight. Lazy loading should keep many large off-screen media files out of the initial load; verify this with browser Network panel or PageSpeed. This audit does not claim the remaining large images have been recompressed.

## Vercel Web Analytics / Speed Insights — owner setup
The source code is wired for Vercel's framework-free Web Analytics script and Speed Insights script. **Enable both products in the Vercel project dashboard** before expecting dashboards or metrics.
1. Open Vercel → project **portfolio-massyne** → Analytics → Enable.
2. Open the same project → Speed Insights → Enable.
3. Redeploy after enabling, then verify the generated instrument URLs in Network.
4. After actual visits, view page views, popular project URLs and Web Vitals in Vercel.
5. Optional custom events: Project View, Resume Open/Download, Email Intent, Project Brief Prepared and Showreel Play. Vercel's custom events can depend on account plan. Our event data contains only generic category strings, **never submitted names, email addresses or project briefs**.
6. Inspect analytics settings and any applicable regional privacy-notice obligations before activating production tracking.

## Remaining measurements before declaring the site fast
- Run a real **mobile** and **desktop** Lighthouse/PageSpeed report for homepage, `/projects/veiled-sorrow.html` and `/resume.html`.
- Look at LCP, INP and CLS, then repeat with browser cache disabled.
- Check 320px, 375px, 768px, 1024px and 1440px widths for layout overflow, contrast, and image sizing.
- Assess if the new **1.88-second entry-only / F5 Signature Opening** affects the first impression (internal project navigation now skips it). It will affect the user's perceived loading experience, even if page resources have finished.
- Downsize the five >1.4MiB archive source images to practical WebP dimensions and visually verify the replacements before deploying; actual optimized source-file bytes remain future work.
- The PDF portfolio is still 30.76 MiB; resize/compress and visually inspect separately before changing the download link.

## How to edit the public availability status
Open `availability.js` and update only the `status` field:
- `inquiries`: neutral/default — OPEN FOR CREATIVE INQUIRIES
- `open`: confirmed availability for selected work
- `limited`: few project slots
- `closed`: currently booked, but visitors can still enquire
Commit to `main` after reviewing the factual state. The site cannot infer real-time availability.

## Mockups disclosure
New Wall Glass / Hoodie / T-shirt product concept scenes reuse original artwork and are labeled **concept visualizations**. They are not a claim of physical production, client campaigns or fabricated case-study outcomes.
