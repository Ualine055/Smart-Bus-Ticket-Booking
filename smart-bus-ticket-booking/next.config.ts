import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /**
   * A stray package-lock.json sits in the user profile directory above this
   * project, so Next.js guessed that as the workspace root and warned on every
   * build. Pinning the root to this folder keeps file tracing inside the app.
   */
  outputFileTracingRoot: path.join(__dirname),
}

export default nextConfig
