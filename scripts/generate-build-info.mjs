import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

function getGitSha() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: resolve("..") }).toString().trim();
  } catch (error) {
    console.warn("⚠️  Could not read git SHA:", error?.message ?? error);
    return "unknown";
  }
}

const buildInfo = {
  appName: process.env.APP_NAME || "AmakaFlow",
  version: process.env.APP_VERSION || "0.0.0-dev",
  gitSha: getGitSha(),
  builtAt: new Date().toISOString(),
  env: process.env.NODE_ENV || "development",
};

const outputPath = resolve("src/build-info.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

console.log("✅ Wrote build info to", outputPath, buildInfo);

