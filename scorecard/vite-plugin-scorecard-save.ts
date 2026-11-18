import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, normalize, resolve, sep } from "node:path";
import type { Plugin } from "vite";

const ALLOWED = new Set([
  "theme.json",
  "scorecard.json",
  "run.json",
  "decisions.json",
  "requirements.json",
  "team.json",
  "interview.json",
  "interview-handoff.json",
  "manual.json",
  "stack.json",
  "apis.json",
  "architecture.json",
  "branches.json",
]);

export function scorecardSavePlugin(contentDir = resolve("content")): Plugin {
  return {
    name: "scorecard-save",
    configureServer(server) {
      server.middlewares.use("/__scorecard/save", (req, res, next) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("POST only");
          return;
        }
        const chunks: Buffer[] = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
              file: string;
              data: unknown;
            };
            const base = body.file?.replace(/^.*[/\\]/, "") ?? "";
            if (!ALLOWED.has(base)) {
              res.statusCode = 400;
              res.end(`file not allowlisted: ${base}`);
              return;
            }
            const target = normalize(join(contentDir, base));
            const root = normalize(contentDir + sep);
            if (!target.startsWith(root) && target !== normalize(contentDir)) {
              res.statusCode = 400;
              res.end("path escape");
              return;
            }
            mkdirSync(dirname(target), { recursive: true });
            writeFileSync(target, JSON.stringify(body.data, null, 2) + "\n", "utf8");
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: true, file: base }));
          } catch (e) {
            res.statusCode = 400;
            res.end(String(e));
          }
        });
      });
    },
  };
}
