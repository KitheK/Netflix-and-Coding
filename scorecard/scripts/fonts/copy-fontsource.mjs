#!/usr/bin/env node
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const out = join(root, "public/fonts/catalog");

/** font id → npm package + preferred woff2 filename under files/ */
const PACKAGES = [
  ["literata", "@fontsource-variable/literata", "literata-latin-wght-normal.woff2"],
  ["fraunces", "@fontsource-variable/fraunces", "fraunces-latin-wght-normal.woff2"],
  ["source-serif-4", "@fontsource-variable/source-serif-4", "source-serif-4-latin-wght-normal.woff2"],
  ["lora", "@fontsource-variable/lora", "lora-latin-wght-normal.woff2"],
  ["inter", "@fontsource-variable/inter", "inter-latin-wght-normal.woff2"],
  ["jetbrains-mono", "@fontsource-variable/jetbrains-mono", "jetbrains-mono-latin-wght-normal.woff2"],
  ["ibm-plex-sans", "@fontsource/ibm-plex-sans", "ibm-plex-sans-latin-400-normal.woff2"],
  ["ibm-plex-mono", "@fontsource/ibm-plex-mono", "ibm-plex-mono-latin-400-normal.woff2"],
];

async function main() {
  await mkdir(out, { recursive: true });
  for (const [id, pkg, file] of PACKAGES) {
    try {
      const base = dirname(require.resolve(`${pkg}/package.json`));
      const src = join(base, "files", file);
      await copyFile(src, join(out, `${id}.woff2`));
      console.log("copied", id);
    } catch (e) {
      console.error("skip", id, e.message);
    }
  }
}

main();