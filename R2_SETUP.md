# Cloudflare R2 setup for MASSYNE Studio

Vercel remains the website host, static frontend host, deployment platform, and API runtime. Cloudflare R2 is used only for media object storage and public media delivery. This integration does not use Cloudflare Pages.

## 1. Create the bucket and media domain

1. In Cloudflare Dashboard, open **R2 Object Storage** and create a bucket for the portfolio (for example, `massyne-portfolio-media`).
2. Open the bucket's **Settings → Public access** and connect a custom domain such as `media.your-domain.com`. Use a domain you control and that Cloudflare can manage.
3. Wait until Cloudflare reports the custom domain as active. Use the HTTPS origin exactly, without a trailing path, in `MASSYNE_R2_PUBLIC_URL`.
4. Do not enable public access on the R2 S3 API endpoint itself. Public delivery should use the custom domain.

## 2. Create a restricted R2 API token

Create an R2 token with **Object Read & Write** permission scoped only to this bucket. Copy the Access Key ID and Secret Access Key once. Find the account ID in the Cloudflare dashboard.

Add these variables in **Vercel → Project → Settings → Environment Variables**, at least for Production (and Preview if you want to test preview deployments):

- `MASSYNE_R2_ACCOUNT_ID` — Cloudflare account ID
- `MASSYNE_R2_ACCESS_KEY_ID` — R2 Access Key ID
- `MASSYNE_R2_SECRET_ACCESS_KEY` — R2 Secret Access Key
- `MASSYNE_R2_BUCKET` — exact bucket name
- `MASSYNE_R2_PUBLIC_URL` — active HTTPS custom media domain

Keep all five values server-side. Never add them to frontend JavaScript, `studio-content.json`, or Git. Redeploy Vercel after setting them.

## 3. Configure bucket CORS for browser uploads

Add a bucket CORS policy allowing the exact origins where Studio runs. Example (replace domains with your real production and preview origins):

```json
[
  {
    "AllowedOrigins": [
      "https://portfolio-massyne.vercel.app",
      "https://www.your-domain.com"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Cache-Control"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Do not use `*` for AllowedOrigins in production. Add your actual custom portfolio domain and any Vercel preview domain only if you intend to upload from it.

## 4. Upload behavior

- Studio first requests a short-lived (5-minute) presigned PUT URL from `/api/studio-r2-upload`.
- That endpoint requires a valid MASSYNE Studio session, same-origin HTTPS request, allowed media MIME type, a maximum of 12 files, and a 3 MiB aggregate upload limit.
- The R2 Access Key ID and Secret Access Key remain in the Vercel API runtime. The browser receives only a time-limited URL scoped to one object and one content type.
- Uploads use unique object keys under `studio-uploads/YYYY/MM/` and return public custom-domain URLs for use in Studio content.
- Until all R2 variables are configured, Studio falls back to the existing authenticated GitHub media uploader. Existing GitHub publishing and other API routes remain intact.

## 5. Migrate existing media

The repository includes `scripts/r2-sync.mjs`, a dependency-free Node.js migration utility. It preserves relative paths under `images/` and `assets/`, so references can be switched without renaming objects.

1. Clone the repository locally and install a current Node.js LTS release (Node 20+).
2. Set the four private R2 variables in your local shell. Do not put real values in `.env.example` or commit them.
3. Run `node scripts/r2-sync.mjs` first. This is a dry run and lists the eligible media files and total bytes.
4. Confirm the bucket and domain are correct, then run `node scripts/r2-sync.mjs --apply`.
5. Open several migrated image and video URLs on the custom domain and confirm they return the correct content types.
6. Only after verifying the migration should the portfolio's static media references be switched to the R2 domain. Keep the original repository files until the site has been verified.

The migration includes supported image, video, font, and SVG files below `images/` and `assets/`; it does not upload PDFs, ZIP archives, QA screenshots, or files outside those two folders. Existing files are not deleted from GitHub.

## 6. Cache policy

The migration utility sets existing objects to `public, max-age=86400, stale-while-revalidate=604800`. New Studio uploads use unique object names and a one-year immutable cache policy. If an object is intentionally replaced at the same key, invalidate or wait out the cache before relying on the new bytes.

## 7. Rollback

To roll back, remove the R2 environment variables from Vercel and redeploy. New Studio uploads will use the existing GitHub uploader again. Do not delete the R2 bucket or the original GitHub media during rollback.
