import { test, expect, type Page } from "@playwright/test";

type PlateCheck = {
  ok: boolean;
  errors: string[];
  minFontPx: number;
  diagramWidthRatio: number;
};

async function checkPlate(page: Page, plateSelector: string, desktop: boolean): Promise<PlateCheck> {
  return page.evaluate(
    ({ sel, desktop }) => {
      const rectsIntersect = (
        a: { left: number; right: number; top: number; bottom: number },
        b: { left: number; right: number; top: number; bottom: number },
        pad = 2,
      ) => {
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        return w > pad && h > pad;
      };
      const errors: string[] = [];
      const frame = document.querySelector(sel) as HTMLElement | null;
      if (!frame) return { ok: false, errors: ["frame missing"], minFontPx: 0, diagramWidthRatio: 0 };

      const clips = frame.querySelectorAll("[clip-path], clipPath");
      if (clips.length > 0) errors.push(`clip paths present (${clips.length})`);

      const svg = frame.querySelector("svg.arch-diagram") as SVGSVGElement | null;
      if (!svg) return { ok: false, errors: ["diagram svg missing"], minFontPx: 0, diagramWidthRatio: 0 };

      const nodeGroups = [...frame.querySelectorAll(".diagram-hit")];
      const bandEls = [...frame.querySelectorAll(".arch-diagram__band")];

      const canvasCol =
        (frame.querySelector(".interactive-plate__canvas") as HTMLElement | null) ??
        (frame.querySelector("[data-testid='arch-diagram-viewport']") as HTMLElement | null);
      const contentW = canvasCol?.clientWidth ?? svg.clientWidth;
      const nodeClientRects = nodeGroups
        .map((g) => g.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0);
      let contentLeft = Infinity;
      let contentRight = -Infinity;
      for (const r of nodeClientRects) {
        contentLeft = Math.min(contentLeft, r.left);
        contentRight = Math.max(contentRight, r.right);
      }
      const bandClientRects = bandEls.map((b) => b.getBoundingClientRect());
      for (const r of bandClientRects) {
        contentLeft = Math.min(contentLeft, r.left);
        contentRight = Math.max(contentRight, r.right);
      }
      const diagramSpan = contentRight > contentLeft ? contentRight - contentLeft : 0;
      const diagramWidthRatio = contentW > 0 ? diagramSpan / contentW : 0;
      if (desktop && diagramWidthRatio < 0.7 - 0.02) {
        errors.push(`diagram span ${(diagramWidthRatio * 100).toFixed(0)}% < 70% of plate canvas`);
      }

      const vb = svg.viewBox.baseVal;

      for (const g of nodeGroups) {
        const title = g.querySelector(".diagram-hit__title") as SVGTextElement | null;
        if (!title) {
          errors.push("node missing title element");
          continue;
        }
        const fullLabel = title.textContent ?? "";
        if (fullLabel.includes("…") || fullLabel.includes("...")) {
          errors.push(`title ellipsis: "${fullLabel}"`);
        }
        if (title.closest("[clip-path]")) errors.push(`title clipped: "${fullLabel.slice(0, 20)}"`);

        const boxRect = (g as SVGGraphicsElement).getBBox();
        const titleBox = title.getBBox();
        const padX = 14;
        if (titleBox.x + titleBox.width > boxRect.x + boxRect.width - padX + 0.5) {
          errors.push(
            `title overflows box: "${fullLabel}" (${titleBox.width.toFixed(0)} > ${(boxRect.width - padX * 2).toFixed(0)})`,
          );
        }
      }

      const nodeTexts = [...frame.querySelectorAll(".diagram-hit text")];
      const boxes = nodeTexts.map((t) => {
        const el = t as SVGTextElement;
        const b = el.getBBox();
        const scale = svg.clientWidth > 0 ? svg.clientWidth / vb.width : 1;
        return { t, b, screen: { w: b.width * scale, h: b.height * scale } };
      });
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i].t.getBoundingClientRect();
          const b = boxes[j].t.getBoundingClientRect();
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          const overlap = w > 12 && h > 12;
          if (overlap) {
            errors.push(`text overlap: "${boxes[i].t.textContent?.slice(0, 16)}" × "${boxes[j].t.textContent?.slice(0, 16)}"`);
          }
        }
      }

      const meetScale = svg.clientWidth > 0 ? svg.clientWidth / vb.width : 1;
      const minFontPx =
        nodeTexts.length === 0
          ? 0
          : Math.min(
              ...nodeTexts.map((t) => {
                const el = t as SVGTextElement;
                const fs = parseFloat(el.getAttribute("font-size") ?? "0");
                if (fs > 0) return fs * meetScale;
                return el.getBoundingClientRect().height;
              }),
            );
      if (minFontPx < 11) errors.push(`min font ${minFontPx.toFixed(1)}px < 11px`);

      const legend = frame.querySelector("[data-testid='arch-legend']") as HTMLElement | null;
      const tag = frame.querySelector("[data-testid='arch-figure-id']") as HTMLElement | null;
      const diagramNodeRects = nodeGroups.flatMap((g) => {
        const rect = g.querySelector("rect") as SVGGraphicsElement | null;
        return rect ? [rect.getBoundingClientRect()] : [];
      });
      const bandRects = bandEls.map((b) => b.getBoundingClientRect());
      const chromeRects = [legend, tag].filter(Boolean).map((el) => (el as HTMLElement).getBoundingClientRect());

      for (const chrome of chromeRects) {
        for (const nr of diagramNodeRects) {
          if (
            rectsIntersect(
              { left: chrome.left, right: chrome.right, top: chrome.top, bottom: chrome.bottom },
              { left: nr.left, right: nr.right, top: nr.top, bottom: nr.bottom },
            )
          ) {
            errors.push("legend or tag overlaps a node box");
            break;
          }
        }
        for (const br of bandRects) {
          if (
            rectsIntersect(
              { left: chrome.left, right: chrome.right, top: chrome.top, bottom: chrome.bottom },
              { left: br.left, right: br.right, top: br.top, bottom: br.bottom },
            )
          ) {
            errors.push("legend or tag overlaps a group band");
            break;
          }
        }
      }

      for (const b of [...nodeGroups].flatMap((g) => [...g.querySelectorAll("rect, ellipse")].map((el) => (el as SVGGraphicsElement).getBBox()))) {
        if (b.x < vb.x - 2 || b.y < vb.y - 2 || b.x + b.width > vb.x + vb.width + 2 || b.y + b.height > vb.y + vb.height + 2) {
          errors.push(`node box outside viewBox (${b.x.toFixed(0)},${b.y.toFixed(0)})`);
        }
      }

      const art = frame.querySelector(".nv-frame__art svg");
      const pathCount = art ? art.querySelectorAll("path, use").length : 0;
      if (pathCount < 12) errors.push(`frame ornament incomplete (path/use count ${pathCount})`);

      const body = frame.querySelector(".nv-frame__body") as HTMLElement | null;
      const diagramHost = frame.querySelector(".arch-diagram-viewport") as HTMLElement | null;
      if (body && diagramHost && body.scrollWidth > body.clientWidth + 4) {
        errors.push("diagram escapes frame body horizontally");
      }

      if (desktop) {
        const minFrameW = Math.min(280, window.innerWidth - 48);
        const minFrameH = 140;
        if (frame.offsetHeight < minFrameH || frame.offsetWidth < minFrameW) {
          errors.push("frame dimensions too small");
        }
      }

      return { ok: errors.length === 0, errors, minFontPx, diagramWidthRatio };
    },
    { sel: plateSelector, desktop },
  );
}

async function openArch(page: Page, url: string) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator("#arch").scrollIntoViewIfNeeded();
  await page.waitForSelector(".architecture-plate__nouveau svg.arch-diagram", { timeout: 15_000 });
  await page.waitForFunction(() => {
    const art = document.querySelector(".architecture-plate__nouveau .nv-frame__art svg");
    return art && art.querySelectorAll("path, use").length >= 12;
  });
  await page.waitForFunction(() => {
    const host = document.querySelector(".interactive-plate__canvas .arch-diagram-viewport") as HTMLElement | null;
    const svg = document.querySelector(".architecture-plate__nouveau svg.arch-diagram") as SVGSVGElement | null;
    if (!host || !svg || svg.clientWidth < 80) return false;
    return Math.abs(host.getBoundingClientRect().width - svg.clientWidth) < 12;
  });
  await page.waitForTimeout(200);
}

for (const [name, width] of [
  ["1280", 1280],
  ["390", 390],
] as const) {
  const desktop = width >= 1024;
  test(`kit architecture plate @ ${name}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await openArch(page, "/scorecard");
    const result = await checkPlate(page, "#arch .architecture-plate__nouveau", desktop);
    expect(result.errors, result.errors.join("; ")).toEqual([]);
    expect(result.minFontPx).toBeGreaterThanOrEqual(11);
    if (desktop) expect(result.diagramWidthRatio).toBeGreaterThanOrEqual(0.68);
  });

  test(`team demo plate @ ${name}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await openArch(page, "/demos/team");
    const result = await checkPlate(page, "#arch .architecture-plate__nouveau", desktop);
    expect(result.errors, result.errors.join("; ")).toEqual([]);
    expect(result.minFontPx).toBeGreaterThanOrEqual(11);
    if (desktop) expect(result.diagramWidthRatio).toBeGreaterThanOrEqual(0.68);
  });
}