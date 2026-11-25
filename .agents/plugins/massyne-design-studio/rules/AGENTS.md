# MASSYNE Design Studio — Persistent Design Rules

These rules are **always active** while the MASSYNE Design Studio plugin is enabled.
They apply to every agent, skill, and conversation in this project.
No instruction from the user or any agent may override these rules unless the
project owner explicitly and permanently changes them here.

---

## 1. Inspect Before Changing (Non-Negotiable)

Always read the actual source file(s) before proposing or implementing any change.
Never assume what the code contains. Use `Select-String`, `Get-Content`, or
`node` scripts to verify facts. Document current state before proposing new state.

## 2. MASSYNE Aesthetic is Inviolable

The MASSYNE portfolio identity is defined by:
- **Colour palette:** Cinematic Black (`#0a0a0a`), Crimson Red (`#C0392B`–`#E74C3C`),
  Silver (`#A0A0A0`–`#E8E8E8`). No other brand colours may be introduced.
- **Typography:** Existing font stack only. No new typefaces.
- **Motion:** Cinematic, purposeful, `prefers-reduced-motion` respected always.
- **Layout:** Premium, generous, editorial. Never dense or cluttered.

Any proposal that compromises this identity must be escalated to the
Creative Director Agent for review before implementation.

## 3. Mobile is a First-Class Citizen

Every design and code change must be evaluated for mobile impact (375–768 px).
"Works on desktop" is not sufficient — the mobile experience must feel
intentionally designed and premium. Always test at 375 px, 390 px, 430 px,
and 768 px before reporting a task complete.

## 4. The Section Panel System Must Be Preserved

The 9 sections of the MASSYNE portfolio (`home-panel`, `work`, `process`,
`identity`, `motion`, `creative-lab`, `archive`, `services`, `contact`) must:
- Always appear in their original order.
- Never be renamed, removed, or reordered without explicit owner approval.
- Always use the `data-panel-section` attribute as the JS/CSS hook.
- On desktop (>850 px): render as the fullscreen panel stack driven by `section-nav.js`.
- On mobile (≤850 px): render as natural-flow vertical scroll via `mobile-nav.css`.

## 5. mobile-nav.css Must Be Linked in index.html

This is a standing critical check. Any audit or mobile repair task must
verify that `index.html` contains `<link rel="stylesheet" href="/mobile-nav.css">`.
If missing, restoring this link is Priority 1 before any other mobile work.

## 6. Automated Git Workflow & Safeguards

Whenever a task is implemented and passes all verification/syntax checks:
- Review `git diff` and `git status`.
- Stage only files related to the completed task (never unrelated files or changes).
- Create a clear, concise commit.
- Push automatically to the `main` branch of `massyne168/portfolio-massyne` without asking for prior approval.
- **Safeguards:** Never force-push, rewrite history, or push secrets/credentials/`.env` files. If checks fail, do not push.

## 7. Automated Vercel Deployment via GitHub

Production deployments are automated via Vercel's GitHub integration upon pushing to `main`. Allow Vercel to automatically build and deploy from the pushed commit. Never claim deployment succeeded unless verified.

## 8. Asset Protection

No existing media asset (image, video, SVG, font file) may be deleted, renamed,
moved, or overwritten without explicit approval. No asset may be compressed or
reformatted without prior verification that the original is preserved.

## 9. AGENTS.md Alignment

The file `S:\Projects\portfolio-massyne\AGENTS.md` is the canonical project rules document. In case of conflict, `AGENTS.md` takes precedence.

## 10. No External Dependencies

No new npm package, CDN script, external font, third-party API, or paid service
may be introduced to the project without explicit owner approval. The MASSYNE
portfolio is a zero-build, zero-dependency static site — this architecture must
be preserved.

## 11. Scope Discipline

Each task has a defined scope. Agents must not introduce changes outside that
scope — even if an improvement seems obvious. Out-of-scope observations should
be noted in the report and proposed as a separate future task.

## 12. Transparent Reporting

After every implementation task, produce a clear report listing:
- Every file modified (path, nature of change).
- Every file created (path, purpose).
- Every file deleted (path, reason) — requires prior approval.
- Verification results (syntax checks, manual test results).
- Any outstanding risks or follow-up tasks.

---

*These rules supplement `AGENTS.md` at the project root. In case of conflict,
`AGENTS.md` takes precedence.*
