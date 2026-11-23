/**
 * Studio GitHub Branch Resolver & Write Guard
 * Resolves target branch and protects main from accidental preview writes.
 */

export function getStudioBranch() {
  const branch = String(
    process.env.MASSYNE_STUDIO_GITHUB_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    "main"
  ).trim();
  return branch || "main";
}

export function assertStudioWriteAllowed(branch) {
  const target = branch || getStudioBranch();
  const vercelEnv = String(process.env.VERCEL_ENV || "").trim().toLowerCase();
  
  if ((vercelEnv === "preview" || vercelEnv === "development") && target === "main") {
    const error = new Error("Writes to the main branch are strictly blocked in " + vercelEnv + " environment.");
    error.status = 403;
    throw error;
  }
  return true;
}
