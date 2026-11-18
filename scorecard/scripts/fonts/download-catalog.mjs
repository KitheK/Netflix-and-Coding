#!/usr/bin/env node
/**
 * Fetch OFL/Apache WOFF2 variable fonts into public/fonts/catalog/.
 * Sources: google/fonts OFL directories (GitHub raw).
 */
import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(root, "public/fonts/catalog");
const RAW = "https://github.com/google/fonts/raw/main";

const FONTS = [
  { id: "literata", file: "ofl/literata/Literata%5Bopsz%2Cwght%5D.woff2", license: "Literata-OFL.txt" },
  { id: "fraunces", file: "ofl/fraunces/Fraunces%5Bopsz%2CWONK%2Csoft%2Cwght%5D.woff2", license: "Fraunces-OFL.txt" },
  { id: "source-serif-4", file: "ofl/sourceserif4/SourceSerif4%5Bopsz%2Cwght%5D.woff2", license: "SourceSerif4-OFL.txt" },
  { id: "lora", file: "ofl/lora/Lora%5Bwght%5D.woff2", license: "Lora-OFL.txt" },
  { id: "inter", file: "ofl/inter/Inter%5Bopsz%2Cwght%5D.woff2", license: "Inter-OFL.txt" },
  { id: "ibm-plex-sans", file: "ofl/ibmplexsans/IBMPlexSans%5Bwght%5D.woff2", license: "IBMPlexSans-OFL.txt" },
  { id: "jetbrains-mono", file: "ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.woff2", license: "JetBrainsMono-OFL.txt" },
  { id: "ibm-plex-mono", file: "ofl/ibmplexmono/IBMPlexMono%5Bwght%5D.woff2", license: "IBMPlexMono-OFL.txt" },
];

const OFL_URL = {
  Literata: `${RAW}/ofl/literata/OFL.txt`,
  Fraunces: `${RAW}/ofl/fraunces/OFL.txt`,
  "Source Serif 4": `${RAW}/ofl/sourceserif4/OFL.txt`,
  Lora: `${RAW}/ofl/lora/OFL.txt`,
  Inter: `${RAW}/ofl/inter/OFL.txt`,
  "IBM Plex Sans": `${RAW}/ofl/ibmplexsans/OFL.txt`,
  "JetBrains Mono": `${RAW}/ofl/jetbrainsmono/OFL.txt`,
  "IBM Plex Mono": `${RAW}/ofl/ibmplexmono/OFL.txt`,
};

async function fetchFile(url, dest) {
  await mkdir(dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const manifest = {};
  for (const f of FONTS) {
    const woff2 = join(outDir, `${f.id}.woff2`);
    await fetchFile(`${RAW}/${f.file}`, woff2);
    const licPath = join(outDir, f.license);
    try {
      const family = f.license.replace("-OFL.txt", "").replace(/-/g, " ");
      const oflKey = Object.keys(OFL_URL).find((k) => f.license.toLowerCase().startsWith(k.toLowerCase().replace(/ /g, "")));
      if (oflKey) await fetchFile(OFL_URL[oflKey], licPath);
    } catch {
      /* optional */
    }
    manifest[f.id] = `/fonts/catalog/${f.id}.woff2`;
    console.log("ok", f.id);
  }
  await writeFile(join(outDir, "download-manifest.json"), JSON.stringify(manifest, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});