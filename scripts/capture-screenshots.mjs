#!/usr/bin/env node
/**
 * App Store Screenshot Automation Script
 * 
 * Captures the 10 screenshots defined in references/app-store-metadata.md
 * using Puppeteer against the Expo web preview.
 * 
 * Sizes:
 *   - 6.7" (iPhone 15 Pro Max): 1290 x 2796
 *   - 5.5" (iPhone 8 Plus): 1242 x 2208
 * 
 * Usage:
 *   node scripts/capture-screenshots.mjs [--base-url http://localhost:8081]
 * 
 * Prerequisites:
 *   pnpm add -D puppeteer
 * 
 * Output:
 *   screenshots/appstore/6.7/{screenshot-name}.png
 *   screenshots/appstore/5.5/{screenshot-name}.png
 */

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Configuration ───────────────────────────────────────────────────────────

const SIZES = {
  "6.7": { width: 1290, height: 2796, scale: 3 }, // iPhone 15 Pro Max @3x
  "5.5": { width: 1242, height: 2208, scale: 3 }, // iPhone 8 Plus @3x
};

// Logical viewport sizes (physical / scale)
const VIEWPORTS = {
  "6.7": { width: 430, height: 932, deviceScaleFactor: 3 },
  "5.5": { width: 414, height: 736, deviceScaleFactor: 3 },
};

const SCREENSHOTS = [
  { name: "01-onboarding-dialect", route: "/onboarding", waitFor: 2000, description: "Onboarding — Dialect Selection" },
  { name: "02-home-dashboard", route: "/", waitFor: 3000, description: "Home Tab — Dashboard" },
  { name: "03-ai-video-call", route: "/hume-call?mode=cloudwave&persona=cloudwave", waitFor: 2000, description: "AI Video Call — Active Session" },
  { name: "04-tv-series", route: "/tv", waitFor: 2000, description: "TV Tab — Series Grid" },
  { name: "05-teacher-overview", route: "/teacher", waitFor: 3000, description: "Teacher Tab — Overview" },
  { name: "06-explore-grid", route: "/explore", waitFor: 2000, description: "Explore Tab — Content Grid" },
  { name: "07-lesson-player", route: "/lesson-player?lessonId=demo", waitFor: 2000, description: "Lesson Player — Active Lesson" },
  { name: "08-slang-dictionary", route: "/dominican-slang-dictionary", waitFor: 2000, description: "Dominican Slang Dictionary" },
  { name: "09-profile-achievements", route: "/profile", waitFor: 2000, description: "Profile Tab — Achievements" },
  { name: "10-methodology", route: "/methodology-recommendation", waitFor: 2000, description: "Methodology Recommendation" },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const baseUrl = process.argv.includes("--base-url")
    ? process.argv[process.argv.indexOf("--base-url") + 1]
    : "http://localhost:8081";

  console.log(`\n📸 App Store Screenshot Capture`);
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   Screenshots: ${SCREENSHOTS.length}`);
  console.log(`   Sizes: 6.7" (1290x2796), 5.5" (1242x2208)\n`);

  // Create output directories
  for (const size of Object.keys(SIZES)) {
    const dir = path.join(ROOT, "screenshots", "appstore", size);
    fs.mkdirSync(dir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  let capturedCount = 0;
  let failedCount = 0;

  for (const size of Object.keys(VIEWPORTS)) {
    const viewport = VIEWPORTS[size];
    console.log(`\n── ${size}" Device (${viewport.width}x${viewport.height} @${viewport.deviceScaleFactor}x) ──`);

    const page = await browser.newPage();
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor,
      isMobile: true,
      hasTouch: true,
    });

    // Set dark color scheme for premium look
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: "dark" },
    ]);

    for (const screenshot of SCREENSHOTS) {
      const url = `${baseUrl}${screenshot.route}`;
      const outputPath = path.join(ROOT, "screenshots", "appstore", size, `${screenshot.name}.png`);

      try {
        console.log(`   📷 ${screenshot.description}...`);
        await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
        await page.waitForTimeout(screenshot.waitFor);

        await page.screenshot({
          path: outputPath,
          fullPage: false, // Viewport only (App Store requires exact dimensions)
          type: "png",
        });

        capturedCount++;
        console.log(`      ✅ Saved: ${path.relative(ROOT, outputPath)}`);
      } catch (err) {
        failedCount++;
        console.log(`      ❌ Failed: ${err.message}`);
      }
    }

    await page.close();
  }

  await browser.close();

  console.log(`\n── Summary ──`);
  console.log(`   ✅ Captured: ${capturedCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   📁 Output: screenshots/appstore/\n`);

  if (failedCount > 0) {
    console.log(`⚠️  Some screenshots failed. Ensure the dev server is running and routes are accessible.`);
    console.log(`   Try: pnpm dev:metro, then re-run this script.\n`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
