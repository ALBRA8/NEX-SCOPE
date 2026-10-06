/**
 * NexScope — /api/version  (public, no auth)
 *
 *   GET /api/version
 *
 * Returns build/runtime metadata for the running instance:
 *
 *   {
 *     name: "nexscope",
 *     version: "1.0.0",
 *     buildDate: "<ISO date of last commit>",
 *     gitSha: "<last commit sha>",
 *     nodeVersion: "v18.x.x",
 *     environment: "development" | "production"
 *   }
 *
 * `buildDate` and `gitSha` are read from `git` at request time. If `git`
 * isn't available (e.g. a Vercel build that doesn't ship the .git dir, a
 * Docker image without git), the fields fall back to `'unknown'` instead
 * of throwing — the endpoint stays usable as a basic version probe.
 *
 * Public (no auth) so monitoring/uptime services can read it without a
 * session — no sensitive data is exposed (no DB URLs, no API keys, no
 * user info).
 */

import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

const APP_VERSION = '1.0.0';

function readGit(field: 'sha' | 'date'): string {
  try {
    if (field === 'sha') {
      return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    }
    // %cI = committer date in ISO 8601 format (e.g. 2024-01-15T13:45:00+02:00)
    return execSync('git log -1 --format=%cI', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'nexscope',
    version: APP_VERSION,
    buildDate: readGit('date'),
    gitSha: readGit('sha'),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
}
