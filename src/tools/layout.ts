import * as fs from "node:fs";
import type { ElasticLayout } from "../schema/types.js";
import { createEmptyLayout } from "../schema/types.js";

export function readLayout(filePath: string): ElasticLayout {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Layout file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as ElasticLayout;
}

export function writeLayout(filePath: string, layout: ElasticLayout): void {
  const json = JSON.stringify(layout, null, 2);
  fs.writeFileSync(filePath, json + "\n");
}

export function ensureLayout(filePath: string, gridSize = 128): ElasticLayout {
  if (fs.existsSync(filePath)) {
    return readLayout(filePath);
  }
  const layout = createEmptyLayout(gridSize);
  writeLayout(filePath, layout);
  return layout;
}
