import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = "/opt/cursor/artifacts";
const port = 5199;
const base = `http://127.0.0.1:${port}`;

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${base}/`);
      if (r.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("dev server did not start");
}

async function openPlate(page, url) {
  await page.goto(`${base}${url}`, { waitUntil: "networkidle" });
  await page.locator("#arch").scrollIntoViewIfNeeded();
  await page.waitForSelector(".architecture-plate__nouveau svg.arch-diagram", { timeout: 20_000 });
  await page.waitForTimeout(400);
}

const shots = [
  { file: "ws3-kit-light-desktop.png", theme: "light", url: "/", width: 1280, height: 900 },
  {
    file: "ws3-kit-light-desktop-selected.png",
    theme: "light",
    url: "/",
    width: 1280,
    height: 900,
    clickLabel: "INTERACTIVE",
  },
  {
    file: "ws3-team-light-desktop-selected.png",
    theme: "light",
    url: "/demos/team",
    width: 1280,
    height: 900,
    clickLabel: "WEB",
  },
  { file: "ws3-kit-light-mobile.png", theme: "light", url: "/", width: 390, height: 844 },
  { file: "ws3-team-light-mobile.png", theme: "light", url: "/demos/team", width: 390, height: 844 },
  { file: "ws3-kit-dark-desktop.png", theme: "dark", url: "/", width: 1280, height: 900 },
  {
    file: "ws3-kit-dark-desktop-selected.png",
    theme: "dark",
    url: "/",
    width: 1280,
    height: 900,
    clickLabel: "INTERACTIVE",
  },
  {
    file: "ws3-team-dark-desktop-selected.png",
    theme: "dark",
    url: "/demos/team",
    width: 1280,
    height: 900,
    clickLabel: "WEB",
  },
  { file: "ws3-kit-dark-mobile.png", theme: "dark", url: "/", width: 390, height: 844 },
  { file: "ws3-team-dark-mobile.png", theme: "dark", url: "/demos/team", width: 390, height: 844 },
];

const server = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", String(port)], {
  cwd: path.join(root, ".."),
  stdio: "ignore",
});

try {
  await waitForServer();
  const browser = await chromium.launch();

  for (const shot of shots) {
    const context = await browser.newContext({
      colorScheme: shot.theme === "dark" ? "dark" : "light",
    });
    await context.addInitScript((theme) => {
      window.sessionStorage.setItem("scorecard.readingTheme", theme);
    }, shot.theme);
    const page = await context.newPage();
    await page.setViewportSize({ width: shot.width, height: shot.height });
    await openPlate(page, shot.url);
    if (shot.theme === "dark") {
      await page.getByRole("button", { name: "DARK" }).click();
      await page.waitForTimeout(250);
    }
    if (shot.clickLabel) {
      const hit = page.locator(".diagram-hit").filter({ hasText: shot.clickLabel }).first();
      if (await hit.count()) await hit.click({ timeout: 5000 });
      else await page.locator(".diagram-hit").first().click();
      await page.waitForTimeout(300);
    }
    const plate = page.locator("#arch .architecture-plate__nouveau");
    await plate.screenshot({ path: path.join(outDir, shot.file) });
    await context.close();
  }

  await browser.close();
} finally {
  server.kill("SIGTERM");
}