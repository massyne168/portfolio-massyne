# MASSYNE 2.0 — Graphic & Motion Designer

Official portfolio: [portfolio-massyne.vercel.app](https://portfolio-massyne.vercel.app/)

A static portfolio for MASSYNE, an independent graphic and motion designer in Morocco. The site uses plain HTML, CSS and JavaScript and deploys from the repository root on Vercel; there is no package install or build step.

## MASSYNE 2.0 structure

- \`index.html\` — new editorial homepage with Works, Motion, Objects, Creative Archive, MASSYNE Lab, Services, About and Contact.
- \`massyne-2.css\` — MASSYNE 2.0 design system for the homepage and every project detail page.
- \`massyne-2.js\` — project rendering and filtering, object catalog, archive filtering and lightbox, mobile navigation, scroll state, pointer interactions and reduced-motion behavior.
- \`project-data.js\` — source of truth for the existing project records. Keep titles, summaries, artwork paths, categories and case-study notes grounded in these records.
- \`projects/<slug>.html\` — static, indexable case-study pages. \`case-study.js\` fills the shared template and provides the existing artwork viewer and related-project navigation.
- \`studio-upgrade.js\` — the user-controlled motion reel and project brief handoff (WhatsApp, email through FormSubmit, and copy).
- \`images/\` and \`assets/\` — original artwork, mockups, video studies, portrait and supporting visual assets. Keep original assets and existing case-study paths intact.
- \`poster-lab.html\`, \`resume.html\`, \`api/\`, \`404.html\`, \`robots.txt\` and \`sitemap.xml\` — existing companion experiences and site infrastructure.

## Adding a project

1. Add a truthful record to \`project-data.js\` with its original artwork path, title, category and notes.
2. Add or update the matching static page at \`projects/<slug>.html\` so the project remains crawlable without client-side rendering.
3. Add new artwork to \`images/\` and reference the correct file. The Works grid and project filters render from the data records.
4. Add new object applications to the \`gurzilApplications\` list in \`massyne-2.js\`, or add a project with a mockup/product category to \`project-data.js\`.

## Interaction and accessibility notes

- Navigation links remain regular anchors; the mobile menu can be opened by keyboard and closed with Escape.
- Work filters and search operate on the existing project data. Project cards lead to their static case-study pages.
- Archive artwork opens in a native dialog with previous/next buttons, arrow-key support and focus restoration.
- Motion clips use the site's original videos, start only when asked, and default to muted playback.
- Pointer effects are limited to fine pointers. Reduced-motion preferences disable nonessential motion.
- The project brief validates required fields and clearly reports when WhatsApp, email delivery or clipboard access needs action from the visitor.

## Deployment

Vercel serves the repository root as a static site. Push changes to \`main\` to trigger the configured deployment. Confirm the Vercel deployment status after pushing; this repository has no GitHub Actions build workflow.
