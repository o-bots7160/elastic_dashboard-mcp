import type { ElasticLayout, WidgetContainer, LayoutWidget, Tab } from "./types.js";
import { isValidWidgetType, getMinSize } from "./widgets.js";

export interface ValidationError {
  path: string;
  message: string;
}

export function validateLayout(layout: ElasticLayout): ValidationError[] {
  const errors: ValidationError[] = [];

  if (layout.version !== 1.0) {
    errors.push({ path: "version", message: `Version must be 1.0, got ${layout.version}` });
  }

  if (!Number.isInteger(layout.grid_size) || layout.grid_size < 1) {
    errors.push({ path: "grid_size", message: `grid_size must be a positive integer, got ${layout.grid_size}` });
  }

  if (!Array.isArray(layout.tabs)) {
    errors.push({ path: "tabs", message: "tabs must be an array" });
    return errors;
  }

  const tabNames = new Set<string>();
  for (let i = 0; i < layout.tabs.length; i++) {
    const tab = layout.tabs[i];
    const tabPath = `tabs[${i}]`;

    if (!tab.name || typeof tab.name !== "string") {
      errors.push({ path: `${tabPath}.name`, message: "Tab name is required" });
    } else if (tabNames.has(tab.name)) {
      errors.push({ path: `${tabPath}.name`, message: `Duplicate tab name: "${tab.name}"` });
    } else {
      tabNames.add(tab.name);
    }

    if (!tab.grid_layout) {
      errors.push({ path: `${tabPath}.grid_layout`, message: "grid_layout is required" });
      continue;
    }

    const allWidgets = [...(tab.grid_layout.containers ?? [])];

    // Validate containers
    for (let j = 0; j < (tab.grid_layout.containers ?? []).length; j++) {
      const widget = tab.grid_layout.containers[j];
      errors.push(...validateWidget(widget, layout.grid_size, `${tabPath}.grid_layout.containers[${j}]`));
    }

    // Validate layouts
    for (let j = 0; j < (tab.grid_layout.layouts ?? []).length; j++) {
      const layoutWidget = tab.grid_layout.layouts[j];
      errors.push(...validateWidget(layoutWidget, layout.grid_size, `${tabPath}.grid_layout.layouts[${j}]`));
      allWidgets.push(layoutWidget);

      if ("children" in layoutWidget && Array.isArray(layoutWidget.children)) {
        for (let k = 0; k < layoutWidget.children.length; k++) {
          errors.push(
            ...validateWidget(
              layoutWidget.children[k],
              layout.grid_size,
              `${tabPath}.grid_layout.layouts[${j}].children[${k}]`,
              true,
            ),
          );
        }
      }
    }

    // Check for overlaps among top-level widgets
    errors.push(...checkOverlaps(allWidgets, layout.grid_size, tabPath));
  }

  return errors;
}

function validateWidget(
  widget: WidgetContainer,
  gridSize: number,
  path: string,
  isChild = false,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!widget.type || typeof widget.type !== "string") {
    errors.push({ path: `${path}.type`, message: "Widget type is required" });
  } else if (!isValidWidgetType(widget.type)) {
    errors.push({ path: `${path}.type`, message: `Unknown widget type: "${widget.type}"` });
  }

  if (!isChild) {
    if (widget.x < 0) {
      errors.push({ path: `${path}.x`, message: `x must be non-negative, got ${widget.x}` });
    }
    if (widget.y < 0) {
      errors.push({ path: `${path}.y`, message: `y must be non-negative, got ${widget.y}` });
    }
  }

  if (widget.width < gridSize) {
    errors.push({ path: `${path}.width`, message: `width must be at least ${gridSize}, got ${widget.width}` });
  }
  if (widget.height < gridSize) {
    errors.push({ path: `${path}.height`, message: `height must be at least ${gridSize}, got ${widget.height}` });
  }

  if (widget.type && isValidWidgetType(widget.type)) {
    const minSize = getMinSize(widget.type, gridSize);
    if (widget.width < minSize.width) {
      errors.push({ path: `${path}.width`, message: `${widget.type} min width is ${minSize.width}, got ${widget.width}` });
    }
    if (widget.height < minSize.height) {
      errors.push({ path: `${path}.height`, message: `${widget.type} min height is ${minSize.height}, got ${widget.height}` });
    }
  }

  if (!widget.properties?.topic && widget.type !== "List Layout") {
    errors.push({ path: `${path}.properties.topic`, message: "topic is required" });
  }

  return errors;
}

function checkOverlaps(
  widgets: WidgetContainer[],
  _gridSize: number,
  tabPath: string,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < widgets.length; i++) {
    for (let j = i + 1; j < widgets.length; j++) {
      const a = widgets[i];
      const b = widgets[j];

      if (rectsOverlap(a, b)) {
        errors.push({
          path: tabPath,
          message: `Widgets overlap: "${a.title}" at (${a.x},${a.y},${a.width}x${a.height}) and "${b.title}" at (${b.x},${b.y},${b.width}x${b.height})`,
        });
      }
    }
  }

  return errors;
}

function rectsOverlap(a: WidgetContainer, b: WidgetContainer): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function findTab(layout: ElasticLayout, tabName: string): Tab | undefined {
  return layout.tabs.find((t) => t.name === tabName);
}

export function findWidget(
  tab: Tab,
  title: string,
): { widget: WidgetContainer; location: "containers" | "layouts"; index: number } | undefined {
  const ci = tab.grid_layout.containers.findIndex((w) => w.title === title);
  if (ci >= 0) return { widget: tab.grid_layout.containers[ci], location: "containers", index: ci };

  const li = tab.grid_layout.layouts.findIndex((w) => w.title === title);
  if (li >= 0) return { widget: tab.grid_layout.layouts[li], location: "layouts", index: li };

  // Search inside layout children
  for (let i = 0; i < tab.grid_layout.layouts.length; i++) {
    const layout = tab.grid_layout.layouts[i];
    if (layout.children) {
      const ci2 = layout.children.findIndex((w) => w.title === title);
      if (ci2 >= 0) return { widget: layout.children[ci2], location: "layouts", index: i };
    }
  }

  return undefined;
}
