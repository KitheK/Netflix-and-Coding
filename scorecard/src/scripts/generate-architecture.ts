import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildArchitecture, scanArchitectureGraph } from "../generators/architecture";

const root = process.argv[2] ? join(process.cwd(), process.argv[2]) : process.cwd();
const out = join(process.cwd(), "content/architecture.json");
const arch = buildArchitecture(scanArchitectureGraph(root));
writeFileSync(out, `${JSON.stringify(arch, null, 2)}\n`);
console.log(`Wrote ${out} (${arch.nodes.length} nodes, ${arch.edges.length} edges)`);