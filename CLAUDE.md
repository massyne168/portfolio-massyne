# MASSYNE Portfolio — CLAUDE.md

This file contains the project rules and context for AI assistants working on the MASSYNE portfolio.

---

## Project Context

- **Local Workspace Path:** `S:\Projects\portfolio-massyne`
- **GitHub Repository:** `massyne168/portfolio-massyne`
- **Production Branch:** `main`
- **Vercel Project:** `massyne/portfolio-massyne`
- **Tech Stack:** Vanilla HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+), Vercel Serverless Functions (`api/`). Zero-build static architecture.

---

## Mandatory AI Workflow Rules

1. **Inspect Before Changing:**
   Always inspect existing code, styles, assets, and project structure before proposing or implementing changes.

2. **Direct Local Workspace Operation:**
   Perform all file operations directly within the local repository (`S:\Projects\portfolio-massyne`).

3. **Asset & Feature Protection:**
   Never delete, rename, or overwrite existing media assets, artwork, or functionality without explicit approval from the project owner.

4. **Secrets & Security:**
   Never expose, display in logs/prompts, or commit secrets, credentials, environment variables, `.env` files, or API tokens.

5. **Post-Change Verification:**
   After any modification, run relevant syntax, link, or functional checks and report the results clearly.

6. **Transparent Change Log:**
   Always provide a concise, file-by-file summary of modified, created, or touched files.

7. **Automated Git Workflow & Safeguards:**
   Whenever a requested task is implemented and verified:
   - Review `git diff` and `git status`.
   - Stage **only** files related to the completed task (never stage unrelated files or changes).
   - Create a concise, meaningful commit message.
   - Automatically push to the `main` branch of `massyne168/portfolio-massyne` without asking for prior confirmation.
   - **Safeguards:**
     - Never force-push or rewrite Git history.
     - Never commit or push secrets, `.env` files, credentials, or private keys.
     - If verification, syntax checks, or tests fail, **stop immediately** and report the errors. Do not commit or push.

8. **Strict Scope Discipline:**
   Never introduce arbitrary or unrelated design, layout, or functional alterations outside the explicit task scope.

9. **Visual Identity & Responsive Standard:**
   Preserve the signature "Cinematic Red" aesthetic (palette, typography, micro-interactions) and ensure seamless responsiveness across mobile, tablet, and desktop viewports.

10. **Automated Vercel Deployment via GitHub:**
    - Vercel is connected to GitHub and automatically deploys production whenever commits are pushed to `main` (`massyne168/portfolio-massyne`).
    - Allow Vercel to automatically build and deploy from the pushed commit.
    - Never claim deployment succeeded unless verified.

---

## Development Notes

- Edit files locally first so changes can be previewed on Live Server.
- Only run `git commit` & `git push origin main` when explicitly instructed to "push" or "deploy".
- The project uses a 9-section panel system: home-panel, work, process, identity, motion, creative-lab, archive, services, contact.
- `mobile-nav.css` must be linked in `index.html` (critical for mobile navigation).
- Aesthetic: Cinematic Black (`#0a0a0a`), Crimson Red (`#C0392B`), Silver (`#C0C0C0`).
- Font roles: Serif display (Space Grotesk, DM Serif Display, Instrument Serif), sans-serif body (Manrope, Outfit, Sora), mono labels (IBM Plex Mono).

---

## Available Skills & Agents

The project includes an Antigravity plugin at `.agents/plugins/massyne-design-studio/` with:
- UI/UX Design Skill (`skills/massyne-uiux-design/SKILL.md`)
- UI/UX Design Agent (`agents/uiux-design-agent.md`)
- Mobile Responsive Agent (`agents/mobile-responsive-agent.md`)
- Creative Director Agent (`agents/creative-director-agent.md`)
- Design Rules (`rules/AGENTS.md`)

Load these when working on design, layout, or responsive tasks.