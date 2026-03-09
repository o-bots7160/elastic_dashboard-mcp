import * as fs from "node:fs";
import type { ElasticLayout } from "../schema/types.js";
import { createEmptyLayout } from "../schema/types.js";
import { getAllWidgetTypes } from "../schema/widgets.js";

// Build the set of keys that Dart expects as doubles from the widget registry.
// Properties with type "number" need .0; "integer" and "color" stay as ints.
const FLOAT_KEYS: Set<string> = (() => {
  const keys = new Set(["grid_size", "x", "y", "width", "height", "period"]);
  for (const wt of getAllWidgetTypes()) {
    for (const prop of wt.properties) {
      if (prop.type === "number") {
        keys.add(prop.name);
      }
    }
  }
  return keys;
})();

/**
 * Serialize a layout to JSON with Dart-compatible float formatting.
 * Ensures numeric values that Dart expects as `double` include a decimal
 * point (e.g. 128.0 instead of 128) to prevent type cast errors in Flutter.
 */
function serializeLayout(layout: ElasticLayout): string {
  const json = JSON.stringify(
    layout,
    (key, value) => {
      if (FLOAT_KEYS.has(key) && typeof value === "number" && Number.isInteger(value)) {
        return `__DART_FLOAT_${value}`;
      }
      return value;
    },
    2,
  );
  return json.replace(/"__DART_FLOAT_(-?\d+)"/g, "$1.0");
}

export function readLayout(filePath: string): ElasticLayout {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Layout file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as ElasticLayout;
}

export function writeLayout(filePath: string, layout: ElasticLayout): void {
  const json = serializeLayout(layout);
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
