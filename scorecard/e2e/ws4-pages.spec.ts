import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "1280", width: 1280, height: 900 },
  { name: "390", width: 390, height: 844 },
] as const;

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  expect(overflow, "document horizontal overflow").toBe(false);
}

for (const vp of VIEWPORTS) {
  test(`home page blocks @ ${vp.name}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(".home-hero")).toBeVisible();
    await expect(page.locator(".architecture-plate svg.arch-diagram")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".home-plate .architecture-plate")).toBeVisible();
    await expect(page.locator(".home-desk-ornaments")).toBeVisible();
    await expect(page.locator("footer.colophon")).toContainText("Made with Scorecard");
    await assertNoHorizontalOverflow(page);
  });

  test(`chapter block gallery @ ${vp.name}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/chapters/03-blocks", { waitUntil: "networkidle" });
    await expect(page.locator(".live-frame").first()).toBeVisible();
    await expect(page.locator(".block-decisions")).toBeVisible();
    await expect(page.locator(".block-requirements li")).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Block gallery" })).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
}