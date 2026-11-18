import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "/opt/cursor/artifacts/ws4-screenshots";
const shots = [
  { name: "home-desktop-light", url: "/", width: 1280, theme: "light" },
  { name: "home-mobile-light", url: "/", width: 390, theme: "light" },
  { name: "chapter-desktop-light", url: "/chapters/03-blocks", width: 1280, theme: "light" },
  { name: "chapter-mobile-light", url: "/chapters/03-blocks", width: 390, theme: "light" },
];

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });

for (const shot of shots) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: shot.width === 390 ? 844 : 900 } });
  await page.goto(`http://127.0.0.1:5199${shot.url}`, { waitUntil: "networkidle" });
  const themeButton = page.getByRole("button", { name: shot.theme === "dark" ? "DARK" : "LIGHT" });
  if (await themeButton.isVisible()) {
    await themeButton.click();
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${shot.name}.png`, fullPage: true });
  await page.close();
}

await browser.close();
console.log(`Wrote ${shots.length} screenshots to ${OUT}`);