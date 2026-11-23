# Cloudflare R2 Media Integration & Architecture Runbook

This document details the architecture, configuration, operation, CI/CD synchronization, and rollback procedures for offloading MASSYNE portfolio media assets to Cloudflare R2 while preserving Vercel as the web host and serverless API runtime.

---

## 1. System Architecture

```
                       +-----------------------------------+
                       |      Client Browser / Visitor     |
                       +-----------------+-----------------+
                                         |
               +-------------------------+-------------------------+
               | HTML / CSS / JS / Favicon                         | Media (Images/Videos/Fonts)
               v                                                   v
+-------------------------------+               +--------------------------------------+
|        Vercel Edge/Host       |               |     Cloudflare R2 Object Storage     |
|   (portfolio-massyne.vercel)  |               |       (massyne-portfolio-01)         |
|                               |               |                                      |
|  - Static files (0-build)     |               |  - https://pub-c78e3da...r2.dev      |
|  - Serverless APIs (api/*)    |               |  - Zero egress bandwidth fees        |
|  - Dark-Only theme lock       |               |  - CORS restricted to Vercel origins |
|  - Studio Write Protection    |               |  - S3-compatible SigV4 PUT / GET     |
+---------------+---------------+               +------------------+-------------------+
                |                                                  ^
                | Presigned PUT URL                                | Direct Browser PUT
                +--------------------------------------------------+
                               Studio Media Upload Flow
```

- **Hosting & APIs**: Vercel hosts all web pages, stylesheets, scripts, serverless functions (`api/`), and local favicons (`images/favicon*.png`).
- **Media Object Storage**: Cloudflare R2 (`massyne-portfolio-01`) stores all images, videos, audio, and font files.
- **Media Delivery**: Public CDN endpoint (`https://pub-c78e3daeef5841a99f5ce6ad0ebd9fdf.r2.dev`) serves media assets with immutable caching.
- **Studio Protection**: Branch guard (`api/_studio-branch.mjs`) prevents Preview/Dev Studio instances from committing to `main`.
- **Theme Standard**: Strict Dark-Only theme lock (`data-theme="dark"`). Light theme code and toggle elements are removed.

---

## 2. Environment Variables & Secrets Reference

### Vercel Preview & Production Variables

| Variable Name | Description | Scope | Sample / Format |
|---|---|---|---|
| `MASSYNE_R2_ACCOUNT_ID` | Cloudflare Account ID | Preview, Prod | 32-character hex string |
| `MASSYNE_R2_ACCESS_KEY_ID` | R2 API Token ID / S3 Access Key ID | Preview, Prod | 32-character hex string |
| `MASSYNE_R2_SECRET_ACCESS_KEY` | SHA-256 Hash of R2 API Token Value | Preview, Prod | 64-character hex string |
| `MASSYNE_R2_BUCKET` | Target R2 bucket name | Preview, Prod | `massyne-portfolio-01` |
| `MASSYNE_R2_PUBLIC_URL` | Public HTTPS media delivery URL | Preview, Prod | `https://pub-c78e3daeef5841a99f5ce6ad0ebd9fdf.r2.dev` |
| `MASSYNE_STUDIO_GITHUB_BRANCH` | Target branch for Studio commits | Preview only | `feat/r2-performance-optimization` |
| `MASSYNE_STUDIO_ACCESS_CODE` | Password for MASSYNE Studio session | Preview, Prod | String |
| `MASSYNE_STUDIO_GITHUB_TOKEN` | GitHub Personal Access Token for Studio | Preview, Prod | Fine-grained token |

### GitHub Actions Secrets

Configured in `massyne168/portfolio-massyne` for the `r2-media-sync.yml` workflow:
- `MASSYNE_R2_ACCOUNT_ID`
- `MASSYNE_R2_ACCESS_KEY_ID`
- `MASSYNE_R2_SECRET_ACCESS_KEY`
- `MASSYNE_R2_BUCKET`
- `MASSYNE_R2_PUBLIC_URL`

---

## 3. Bucket CORS Policy

Configured on `massyne-portfolio-01` to authorize direct browser uploads from Vercel environments:

```json
[
  {
    "AllowedOrigins": [
      "https://portfolio-massyne.vercel.app",
      "https://*.vercel.app"
    ],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["Content-Type", "Cache-Control"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 4. Local Media Synchronization (`scripts/r2-sync.mjs`)

The project includes a dependency-free Node.js CLI script using AWS SigV4:

### Capabilities:
- **Zero Dependencies**: Uses standard Node.js `crypto`, `fs/promises`, and native `fetch`.
- **Dry-Run by Default**: Safe read-only inspection; `--apply` required for uploads.
- **Idempotency**: Issues `HEAD` requests checking `x-amz-meta-sha256` and file size. Skips unmodified assets.
- **Multipart Upload**: Automatically activates 5 MiB multipart chunks for assets $\ge$ 8 MiB, with automatic `AbortMultipartUpload` on failure.
- **Exponential Backoff**: Up to 3 retry attempts per asset.
- **URL Verification**: Probes public CDN endpoint (`--verify-urls`) ensuring HTTP 200 and MIME match.
- **Asset Exclusions**: Preserves `images/favicon*.png` on Vercel host; excludes dotfiles, `.zip`, and PDFs (unless `--include-pdfs` passed).

### Usage:

```bash
# 1. Dry run audit
node scripts/r2-sync.mjs

# 2. Live sync with public URL verification
node scripts/r2-sync.mjs --apply --verify-urls

# 3. Optional: include PDF documents
node scripts/r2-sync.mjs --apply --verify-urls --include-pdfs
```

---

## 5. GitHub Actions Workflow (`.github/workflows/r2-media-sync.yml`)

Manual trigger (`workflow_dispatch`) only:
1. Navigate to **Actions → Cloudflare R2 Media Sync**.
2. Select target feature branch (e.g. `feat/r2-performance-optimization`).
3. Inputs:
   - `dry_run`: `true` (default) or `false`.
   - `include_pdfs`: `false` (default) or `true`.
   - `confirm_apply`: Type `APPLY_R2_MIGRATION` if running live sync.
4. **Safety Guards**:
   - The workflow immediately aborts if triggered on the `main` branch.
   - Live uploads fail without exact confirmation phrase.
   - Generates a markdown summary in `$GITHUB_STEP_SUMMARY`.

---

## 6. Studio Media Upload Flow

1. Studio user authenticates via `/api/studio-login`.
2. User selects media in Studio UI (up to 10 MB per image, 25 MB per video, 35 MB batch).
3. Studio sends file metadata to `/api/studio-r2-upload.mjs`.
4. The serverless API checks authentication and origin, then generates 5-minute AWS SigV4 presigned PUT URLs for R2 under `studio-uploads/YYYY/MM/`.
5. Browser uploads binary directly to R2 bucket via `fetch(presignedUrl, { method: "PUT" })`.
6. Public CDN URL is written to `studio-content.json`.
7. `/api/studio-publish.mjs` commits content to GitHub (`feat/r2-performance-optimization` on Preview; blocked from `main` on Preview).
8. If R2 is unconfigured, Studio falls back to `/api/studio-media-upload.mjs` (GitHub API) with a 5 MB maximum batch limit.

---

## 7. Rollback Plan

All original media files remain backed up in the Git repository (`images/` and `assets/`). In the event of a rollback:

1. **Revert Media References**: Replace R2 CDN domain in HTML/CSS/JS with relative local paths (`/images/` and `/assets/`).
2. **Remove Vercel Env Vars**: Remove `MASSYNE_R2_*` from Vercel Project Settings. Studio will seamlessly revert to GitHub commit uploads.
3. **No Data Loss**: The Cloudflare R2 bucket and GitHub repository retain full history.
