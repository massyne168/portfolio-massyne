#!/usr/bin/env node
/**
 * Repo-wide Media Auditor (Read-Only)
 * Discovers all media files, computes SHA-256 hashes, detects duplicates,
 * flags oversized assets, and checks for broken references across HTML/CSS/JS/JSON/MD.
 */

import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const MEDIA_EXTS = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg",
  ".mp4", ".webm", ".mov",
  ".woff", ".woff2", ".ttf", ".otf",
  ".pdf", ".mp3", ".wav"
]);

const CODE_EXTS = new Set([
  ".html", ".css", ".js", ".mjs", ".cjs", ".json", ".md"
]);

const IGNORED_DIRS = new Set([
  ".git", ".agents", "node_modules", ".vercel", ".gemini"
]);

const EXAMPLE_REFS = new Set([
  "images/studio-uploads/background.mp4"
]);

const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const VIDEO_MAX_BYTES = 25 * 1024 * 1024; // 25 MB

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeRef(ref) {
  return ref
    .replace(/^https?:\/\/[^/]+\//, "")
    .replace(/^\/+/, "")
    .split("?")[0]
    .split("#")[0]
    .trim();
}

async function main() {
  console.log("=== MASSYNE REPO MEDIA AUDITOR ===");
  console.log(`Working Directory: ${root}\n`);

  const allFiles = await walk(root);
  const mediaFiles = [];
  const codeFiles = [];

  for (const f of allFiles) {
    const ext = path.extname(f).toLowerCase();
    if (MEDIA_EXTS.has(ext)) {
      mediaFiles.push(f);
    }
    if (CODE_EXTS.has(ext)) {
      codeFiles.push(f);
    }
  }

  console.log(`Discovered ${mediaFiles.length} media files across the repository.`);
  console.log(`Scanning ${codeFiles.length} code/markup files for media references...\n`);

  // 1. Analyze media files: size, SHA-256, duplicates, oversized
  let totalBytes = 0;
  const hashToFiles = new Map();
  const fileToMeta = new Map();
  const oversized = [];
  const diskMediaRelative = new Set();

  for (const file of mediaFiles) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    diskMediaRelative.add(rel);
    const s = await stat(file);
    const bytes = await readFile(file);
    const hash = sha256(bytes);
    totalBytes += s.size;

    const ext = path.extname(file).toLowerCase();
    const isImage = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"].includes(ext);
    const isVideo = [".mp4", ".webm", ".mov"].includes(ext);

    if (isImage && s.size > IMAGE_MAX_BYTES) {
      oversized.push({ file: rel, size: s.size, limit: "10 MB", type: "image" });
    }
    if (isVideo && s.size > VIDEO_MAX_BYTES) {
      oversized.push({ file: rel, size: s.size, limit: "25 MB", type: "video" });
    }

    if (!hashToFiles.has(hash)) hashToFiles.set(hash, []);
    hashToFiles.get(hash).push(rel);

    fileToMeta.set(rel, { size: s.size, hash, ext });
  }

  // 2. Scan code files for references
  const referencedPaths = new Map(); // normalizedPath -> array of { file, line, raw }
  const refPattern = /(?:(?:https?:\/\/[a-zA-Z0-9.-]+\.r2\.dev\/|\/|(?:(?:\.\.\/)+))?(images|assets)\/[a-zA-Z0-9_\-./% ]+\.[a-zA-Z0-9]+)/gi;

  for (const codeFile of codeFiles) {
    const relCode = path.relative(root, codeFile).split(path.sep).join("/");
    // Skip scripts/ itself and backup folders
    if (relCode.startsWith("scripts/") || relCode.startsWith("backup/")) continue;

    const content = await readFile(codeFile, "utf8");
    const lines = content.split("\n");

    lines.forEach((lineText, lineIdx) => {
      let match;
      refPattern.lastIndex = 0;
      while ((match = refPattern.exec(lineText)) !== null) {
        const raw = match[0];
        let decoded = raw;
        try { decoded = decodeURIComponent(raw); } catch (_) {}
        const normalized = normalizeRef(decoded);

        if (!referencedPaths.has(normalized)) {
          referencedPaths.set(normalized, []);
        }
        referencedPaths.get(normalized).push({
          file: relCode,
          line: lineIdx + 1,
          raw
        });
      }
    });
  }

  // 3. Find broken references
  const brokenReferences = [];
  for (const [refPath, occurrences] of referencedPaths.entries()) {
    if (EXAMPLE_REFS.has(refPath)) continue;
    if (!diskMediaRelative.has(refPath)) {
      brokenReferences.push({ refPath, occurrences });
    }
  }

  // 4. Find duplicates
  const duplicates = [];
  for (const [hash, fileList] of hashToFiles.entries()) {
    if (fileList.length > 1) {
      duplicates.push({ hash, files: fileList });
    }
  }

  // 5. Unreferenced media
  const unreferenced = [];
  for (const diskRel of diskMediaRelative) {
    if (!referencedPaths.has(diskRel)) {
      unreferenced.push(diskRel);
    }
  }

  // Report results
  console.log("----------------- AUDIT REPORT -----------------");
  console.log(`Total Media Assets : ${mediaFiles.length} files (${(totalBytes / 1024 / 1024).toFixed(2)} MiB)`);
  console.log(`Distinct References: ${referencedPaths.size} unique paths in codebase`);
  console.log(`Broken References  : ${brokenReferences.length}`);
  console.log(`Duplicate Sets     : ${duplicates.length}`);
  console.log(`Oversized Assets   : ${oversized.length}`);
  console.log(`Unreferenced Assets: ${unreferenced.length}`);
  console.log("------------------------------------------------\n");

  if (brokenReferences.length > 0) {
    console.log("⚠️ BROKEN REFERENCES DETECTED:");
    for (const b of brokenReferences) {
      console.log(`  - "${b.refPath}" referenced in:`);
      for (const occ of b.occurrences.slice(0, 3)) {
        console.log(`      ${occ.file}:${occ.line} [${occ.raw}]`);
      }
      if (b.occurrences.length > 3) {
        console.log(`      ... and ${b.occurrences.length - 3} more places`);
      }
    }
    console.log();
  } else {
    console.log("✅ 0 Broken References found. All media references resolve to disk assets.\n");
  }

  if (duplicates.length > 0) {
    console.log(`ℹ️ DUPLICATE ASSET SETS (${duplicates.length}):`);
    for (const d of duplicates.slice(0, 5)) {
      console.log(`  Hash ${d.hash.slice(0, 12)}... shared by:`);
      for (const f of d.files) console.log(`    - ${f}`);
    }
    if (duplicates.length > 5) console.log(`  ... and ${duplicates.length - 5} more sets`);
    console.log();
  }

  if (oversized.length > 0) {
    console.log(`⚠️ OVERSIZED ASSETS (${oversized.length}):`);
    for (const o of oversized) {
      console.log(`  - ${o.file}: ${(o.size / 1024 / 1024).toFixed(2)} MB (limit: ${o.limit})`);
    }
    console.log();
  } else {
    console.log("✅ All media files are within size limits (<= 10MB images, <= 25MB videos).\n");
  }

  console.log("=== AUDIT COMPLETE ===");
  if (brokenReferences.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error("Audit error:", err);
  process.exit(1);
});
