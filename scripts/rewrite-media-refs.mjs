#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const R2_BASE = "https://pub-c78e3daeef5841a99f5ce6ad0ebd9fdf.r2.dev";
const apply = process.argv.includes("--apply");

const PRECONNECT_TAG = `<link rel="preconnect" href="${R2_BASE}" crossorigin>`;

const TARGET_FILES = [
  "index.html",
  "project.html",
  "resume.html",
  "studio.html",
  "case-study.js",
  "parallax-bg.js",
  "project-data.js",
  "studio-content.js",
  "studio-content.json",
  "studio-upgrade.js"
];

// Helper to check if a media path should be rewritten to R2
function isR2Migrated(mediaPath) {
  if (!mediaPath) return false;
  const clean = mediaPath.trim();
  if (clean.includes("favicon")) return false;
  if (clean.toLowerCase().endsWith(".pdf")) return false;
  if (clean.startsWith("images/") || clean.startsWith("/images/") || clean.startsWith("assets/") || clean.startsWith("/assets/")) {
    return true;
  }
  return false;
}

function toR2Url(mediaPath) {
  const normalized = mediaPath.trim().replace(/^\/+/, "");
  return `${R2_BASE}/${normalized}`;
}

async function collectHtmlFiles() {
  const results = [...TARGET_FILES.filter(f => f.endsWith(".html"))];
  const projectsDir = path.join(root, "projects");
  try {
    const entries = await readdir(projectsDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(".html")) {
        results.push(path.join("projects", e.name));
      }
    }
  } catch (err) {
    console.error("Error reading projects dir:", err.message);
  }
  return results;
}

async function processFile(relPath) {
  const fullPath = path.join(root, relPath);
  let content = await readFile(fullPath, "utf-8");
  const original = content;
  let rewrites = 0;

  // 1. If HTML, ensure preconnect tag in head
  if (relPath.endsWith(".html")) {
    if (!content.includes(R2_BASE) || !content.includes('rel="preconnect"')) {
      const headIdx = content.indexOf("<head>");
      if (headIdx !== -1) {
        const insertPos = headIdx + "<head>".length;
        content = content.slice(0, insertPos) + PRECONNECT_TAG + content.slice(insertPos);
        rewrites++;
      }
    }
  }

  // 2. Specific replacements for Vercel production domain prefix on images
  // e.g. https://portfolio-massyne.vercel.app/images/optimized/... -> R2_BASE/images/optimized/...
  content = content.replace(/https:\/\/portfolio-massyne\.vercel\.app\/(images\/[^"'\s>]+)/g, (match, p1) => {
    if (p1.includes("favicon") || p1.toLowerCase().endsWith(".pdf")) return match;
    rewrites++;
    return `${R2_BASE}/${p1}`;
  });

  // 3. Match src, srcset, href, or JSON/JS string paths for images/ and assets/
  // Match quoted strings like "images/..." or '/images/...' or src="images/..."
  content = content.replace(/(["'`])(\/?(?:images|assets)\/[^"'`\s>]+)\1/g, (match, quote, p1) => {
    if (!isR2Migrated(p1)) return match;
    rewrites++;
    return `${quote}${toR2Url(p1)}${quote}`;
  });

  // 4. In HTML srcset, handles multiple space-separated candidates: srcset="images/foo-480.webp 480w, images/foo-800.webp 800w"
  content = content.replace(/srcset=(["'])(.*?)\1/gs, (match, quote, val) => {
    let changed = false;
    const parts = val.split(",").map(part => {
      const trimmed = part.trim();
      const [src, descriptor] = trimmed.split(/\s+/);
      if (isR2Migrated(src)) {
        changed = true;
        rewrites++;
        const newSrc = toR2Url(src);
        return descriptor ? `${newSrc} ${descriptor}` : newSrc;
      }
      return trimmed;
    });
    if (changed) {
      return `srcset=${quote}${parts.join(", ")}${quote}`;
    }
    return match;
  });

  // 5. In HTML <video>, ensure preload="none" for background or motion videos
  if (relPath === "index.html") {
    content = content.replace(/<video\b([^>]*?)>/gi, (match, attrs) => {
      if (!/preload=/i.test(attrs)) {
        return `<video ${attrs} preload="none">`;
      }
      return match;
    });
  }

  if (content !== original) {
    console.log(`${apply ? "UPDATED" : "WOULD UPDATE"} [${relPath}]: ${rewrites} replacements made.`);
    if (apply) {
      await writeFile(fullPath, content, "utf-8");
    }
  } else {
    console.log(`NO CHANGE [${relPath}]`);
  }

  return rewrites;
}

async function main() {
  console.log("=== REWRITE MEDIA REFERENCES TO R2 ===");
  console.log(`Target R2 CDN: ${R2_BASE}`);
  console.log(`Mode:          ${apply ? "APPLY (live write)" : "DRY RUN (inspection only)"}\n`);

  const allFiles = new Set([...TARGET_FILES, ...await collectHtmlFiles()]);
  let totalRewrites = 0;

  for (const rel of allFiles) {
    const count = await processFile(rel);
    totalRewrites += count;
  }

  console.log(`\nCompleted! Total media rewrites: ${totalRewrites}.`);
  if (!apply) {
    console.log("Run with --apply to apply all rewrites to disk.");
  }
}

main().catch(console.error);
