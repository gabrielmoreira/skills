import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

export async function discoverScenarioModulePaths(root = "."): Promise<string[]> {
  const all = await walk(root);
  return all.filter((p) => /typescript-[^/]+\/evals\/[^/]+\.scenarios\.ts$/.test(p)).sort();
}
