import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readLayout, writeLayout, ensureLayout } from "./tools/layout.js";
import { ConfigManager } from "./config/manager.js";
import {
  createEmptyLayout,
  createTab,
  createWidget,
  createListLayout,
} from "./schema/types.js";
import type {
  ElasticLayout,
  Tab,
  WidgetContainer,
  LayoutWidget,
} from "./schema/types.js";
import { validateLayout, findTab, findWidget } from "./schema/validation.js";
import {
  getWidgetTypeInfo,
  getDefaultSize,
  getAllWidgetTypes,
  isValidWidgetType,
  resolveWidgetType,
  suggestWidgetType,
} from "./schema/widgets.js";
import { findNextAvailablePosition, getOccupiedRects, snapToGrid } from "./utils/grid.js";
import { hexToArgbInt, argbIntToHex } from "./utils/color.js";

export function createServer(configDir?: string): McpServer {
  const config = new ConfigManager(configDir);

  const server = new McpServer({
    name: "elastic-dashboard-mcp",
    version: "0.1.0",
  });

  // ──────────────────────────────────────────────
  // READ / INSPECT TOOLS
  // ──────────────────────────────────────────────

  server.tool(
    "get_layout",
    "Read an Elastic Dashboard layout JSON file and return its structure",
    { file_path: z.string().describe("Path to the layout JSON file") },
    async ({ file_path }) => {
      try {
        const layout = readLayout(file_path);
        const summary = layout.tabs.map((t) => ({
          name: t.name,
          widgets: t.grid_layout.containers.length,
          layouts: t.grid_layout.layouts.length,
        }));
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ grid_size: layout.grid_size, version: layout.version, tabs: summary }, null, 2),
            },
          ],
        };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    "get_tab",
    "Get details of a specific tab including all its widgets",
    {
      file_path: z.string().describe("Path to the layout JSON file"),
      tab_name: z.string().describe("Name of the tab"),
    },
    async ({ file_path, tab_name }) => {
      try {
        const layout = readLayout(file_path);
        const tab = findTab(layout, tab_name);
        if (!tab) return { content: [{ type: "text" as const, text: `Tab "${tab_name}" not found. Available: ${layout.tabs.map((t) => t.name).join(", ")}` }], isError: true };
        return { content: [{ type: "text" as const, text: JSON.stringify(tab, null, 2) }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    "validate_layout",
    "Validate a layout file against the Elastic Dashboard schema rules",
    { file_path: z.string().describe("Path to the layout JSON file") },
    async ({ file_path }) => {
      try {
        const layout = readLayout(file_path);
        const errors = validateLayout(layout);
        if (errors.length === 0) {
          return { content: [{ type: "text" as const, text: "✓ Layout is valid" }] };
        }
        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${errors.length} issue(s):\n${errors.map((e) => `  • ${e.path}: ${e.message}`).join("\n")}`,
            },
          ],
        };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    "list_widget_types",
    "List all available Elastic Dashboard widget types with their properties and sizes",
    {
      category: z
        .enum(["all", "single-topic", "multi-topic", "layout"])
        .optional()
        .describe("Filter by category"),
    },
    async ({ category }) => {
      let types = getAllWidgetTypes();
      if (category && category !== "all") {
        types = types.filter((t) => t.category === category);
      }
      const summary = types.map((t) => ({
        type: t.type,
        aliases: t.aliases,
        category: t.category,
        defaultSize: `${t.defaultWidth}x${t.defaultHeight}`,
        minSize: `${t.minWidth}x${t.minHeight}`,
        properties: t.properties.map((p) => `${p.name}: ${p.type}${p.defaultValue !== undefined ? ` = ${JSON.stringify(p.defaultValue)}` : ""}${p.options ? ` [${p.options.join(", ")}]` : ""}`),
      }));
      return { content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }] };
    },
  );

  // ──────────────────────────────────────────────
  // CREATE TOOLS
  // ──────────────────────────────────────────────

  server.tool(
    "create_layout",
    "Create a new empty Elastic Dashboard layout file",
    {
      file_path: z.string().describe("Path for the new layout JSON file"),
      grid_size: z.number().int().positive().optional().describe("Grid size in pixels (default: 128)"),
      tab_names: z.array(z.string()).optional().describe("Initial tab names to create"),
    },
    async ({ file_path, grid_size, tab_names }) => {
      try {
        const layout = createEmptyLayout(grid_size ?? 128);
        if (tab_names) {
          for (const name of tab_names) {
            layout.tabs.push(createTab(name));
          }
        }
        writeLayout(file_path, layout);
        return { content: [{ type: "text" as const, text: `Created layout at ${file_path} with ${layout.tabs.length} tab(s)` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    "add_tab",
    "Add a new tab to an existing layout",
    {
      file_path: z.string().describe("Path to the layout JSON file"),
      tab_name: z.string().describe("Name for the new tab"),
    },
    async ({ file_path, tab_name }) => {
      try {
        const layout = readLayout(file_path);
        if (findTab(layout, tab_name)) {
          return { content: [{ type: "text" as const, text: `Tab "${tab_name}" already exists` }], isError: true };
        }
        layout.tabs.push(createTab(tab_name));
        writeLayout(file_path, layout);
        return { content: [{ type: "text" as const, text: `Added tab "${tab_name}"` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    "add_widget",
    "Add a widget to a tab. Position is auto-calculated if not specified.",
    {
      file_path: z.string().describe("Path to the layout JSON file"),
      tab_name: z.string().describe("Tab to add the widget to"),
      widget_type: z.string().describe("Widget type (e.g., 'Boolean Box', 'Graph', 'SwerveDrive')"),
      title: z.string().describe("Widget title"),
      topic: z.string().describe("NetworkTables topic path (e.g., '/SmartDashboard/MyValue')"),
      x: z.number().optional().describe("X position in pixels (auto if omitted)"),
      y: z.number().optional().describe("Y position in pixels (auto if omitted)"),
      width: z.number().optional().describe("Width in pixels (uses default for type if omitted)"),
      height: z.number().optional().describe("Height in pixels (uses default for type if omitted)"),
      properties: z.record(z.string(), z.unknown()).optional().describe("Additional widget properties"),
    },
    async ({ file_path, tab_name, widget_type, title, topic, x, y, width, height, properties }) => {
      try {
        const layout = ensureLayout(file_path);
        let tab = findTab(layout, tab_name);
        if (!tab) {
          layout.tabs.push(createTab(tab_name));
          tab = layout.tabs[layout.tabs.length - 1];
        }

        const resolvedType = resolveWidgetType(widget_type);
        if (!isValidWidgetType(resolvedType)) {
          return { content: [{ type: "text" as const, text: `Unknown widget type: "${widget_type}"` }], isError: true };
        }

        const gridSize = layout.grid_size;
        const defaultSize = getDefaultSize(resolvedType, gridSize);
        const w = snapToGrid(width ?? defaultSize.width, gridSize);
        const h = snapToGrid(height ?? defaultSize.height, gridSize);

        let wx: number, wy: number;
        if (x !== undefined && y !== undefined) {
          wx = snapToGrid(x, gridSize);
          wy = snapToGrid(y, gridSize);
        } else {
          const occupied = getOccupiedRects(tab.grid_layout.containers, tab.grid_layout.layouts);
          const pos = findNextAvailablePosition(occupied, w, h, gridSize);
          wx = pos.x;
          wy = pos.y;
        }

        // Apply config defaults
        const extraProps: Record<string, unknown> = { ...properties };
        if (resolvedType === "Text Display" && extraProps.show_submit_button === undefined) {
          extraProps.show_submit_button = config.get().defaults.show_submit_button;
        }

        const isTunable = config.isTunableTopic(topic);
        const period = resolvedType === "Graph"
          ? config.get().defaults.graph_period
          : config.get().defaults.period;
        extraProps.period = period;

        const widget = createWidget(resolvedType, title, topic, wx, wy, w, h, extraProps);

        if (resolvedType === "List Layout") {
          tab.grid_layout.layouts.push(widget as LayoutWidget);
        } else {
          tab.grid_layout.containers.push(widget);
        }

        writeLayout(file_path, layout);
        return {
          content: [
            {
              type: "text" as const,
              text: `Added ${resolvedType} "${title}" at (${wx}, ${wy}) ${w}x${h}px on tab "${tab_name}"${isTunable ? " [tunable]" : ""}`,
            },
          ],
        };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    "add_widgets_batch",
    "Add multiple widgets to a tab at once with auto-layout",
    {
      file_path: z.string().describe("Path to the layout JSON file"),
      tab_name: z.string().describe("Tab to add widgets to"),
      widgets: z
        .array(
          z.object({
            widget_type: z.string(),
            title: z.string(),
            topic: z.string(),
            properties: z.record(z.string(), z.unknown()).optional(),
          }),
        )
        .describe("Array of widgets to add"),
    },
    async ({ file_path, tab_name, widgets }) => {
      try {
        const layout = ensureLayout(file_path);
        let tab = findTab(layout, tab_name);
        if (!tab) {
          layout.tabs.push(createTab(tab_name));
          tab = layout.tabs[layout.tabs.length - 1];
        }

        const gridSize = layout.grid_size;
        const added: string[] = [];

        for (const w of widgets) {
          const resolvedType = resolveWidgetType(w.widget_type);
          if (!isValidWidgetType(resolvedType)) {
            added.push(`⚠ Skipped "${w.title}": unknown type "${w.widget_type}"`);
            continue;
          }

          const defaultSize = getDefaultSize(resolvedType, gridSize);
          const ww = defaultSize.width;
          const wh = defaultSize.height;

          const occupied = getOccupiedRects(tab.grid_layout.containers, tab.grid_layout.layouts);
          const pos = findNextAvailablePosition(occupied, ww, wh, gridSize);

          const extraProps: Record<string, unknown> = { ...w.properties };
          if (resolvedType === "Text Display" && extraProps.show_submit_button === undefined) {
            extraProps.show_submit_button = config.get().defaults.show_submit_button;
          }
          const period = resolvedType === "Graph" ? config.get().defaults.graph_period : config.get().defaults.period;
          extraProps.period = period;

          const widget = createWidget(resolvedType, w.title, w.topic, pos.x, pos.y, ww, wh, extraProps);
          tab.grid_layout.containers.push(widget);
          added.push(`✓ ${resolvedType} "${w.title}" at (${pos.x}, ${pos.y})`);
        }

        writeLayout(file_path, layout);
        return { content: [{ type: "text" as const, text: `Added ${added.length} widget(s) to "${tab_name}":\n${added.join("\n")}` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  // ──────────────────────────────────────────────
  // MODIFY TOOLS
  // ──────────────────────────────────────────────

  server.tool(
    "move_widget",
    "Move a widget to a new position on the grid",
    {
      file_path: z.string().describe("Path to the layout JSON file"),
      tab_name: z.string().describe("Tab containing the widget"),
      widget_title: z.string().describe("Title of the widget to move"),
      x: z.number().describe("New X position in pixels"),
      y: z.number().describe("New Y position in pixels"),
    },
    async ({ file_path, tab_name, widget_title, x, y }) => {
      try {
        const layout = readLayout(file_path);
        const tab = findTab(layout, tab_name);
        if (!tab) return { content: [{ type: "text" as const, text: `Tab "${tab_name}" not found` }], isError: true };

        const result = findWidget(tab, widget_title);
        if (!result) return { content: [{ type: "text" as const, text: `Widget "${widget_title}" not found in tab "${tab_name}"` }], isError: true };

        const gs = layout.grid_size;
        result.widget.x = snapToGrid(x, gs);
        result.widget.y = snapToGrid(y, gs);
        writeLayout(file_path, layout);
        return { content: [{ type: "text" as const, text: `Moved "${widget_title}" to (${result.widget.x}, ${result.widget.y})` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    "resize_widget",
    "Resize a widget",
    {
      file_path: z.string().describe("Path to the layout JSON file"),
      tab_name: z.string().describe("Tab containing the widget"),
      widget_title: z.string().describe("Title of the widget to resize"),
      width: z.number().describe("New width in pixels"),
      height: z.number().describe("New height in pixels"),
    },
    async ({ file_path, tab_name, widget_title, width, height }) => {
      try {
        const layout = readLayout(file_path);
        const tab = findTab(layout, tab_name);
        if (!tab) return { content: [{ type: "text" as const, text: `Tab "${tab_name}" not found` }], isError: true };

        const result = findWidget(tab, widget_title);
        if (!result) return { content: [{ type: "text" as const, text: `Widget "${widget_title}" not found` }], isError: true };

        const gs = layout.grid_size;
        result.widget.width = snapToGrid(width, gs);
        result.widget.height = snapToGrid(height, gs);
        writeLayout(file_path, layout);
        return { content: [{ type: "text" as const, text: `Resized "${widget_title}" to ${result.widget.width}x${result.widget.height}` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    "update_widget_properties",
    "Update properties on an existing widget",
    {
      file_path: z.string().describe("Path to the layout JSON file"),
      tab_name: z.string().describe("Tab containing the widget"),
      widget_title: z.string().describe("Title of the widget"),
      properties: z.record(z.string(), z.unknown()).describe("Properties to set or update"),
    },
    async ({ file_path, tab_name, widget_title, properties }) => {
      try {
        const layout = readLayout(file_path);
        const tab = findTab(layout, tab_name);
        if (!tab) return { content: [{ type: "text" as const, text: `Tab "${tab_name}" not found` }], isError: true };

        const result = findWidget(tab, widget_title);
        if (!result) return { content: [{ type: "text" as const, text: `Widget "${widget_title}" not found` }], isError: true };

        Object.assign(result.widget.properties, properties);
        writeLayout(file_path, layout);
        return { content: [{ type: "text" as const, text: `Updated properties on "${widget_title}": ${Object.keys(properties).join(", ")}` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    "rename_tab",
    "Rename an existing tab",
    {
      file_path: z.string().describe("Path to the layout JSON file"),
      old_name: z.string().describe("Current tab name"),
      new_name: z.string().describe("New tab name"),
    },
    async ({ file_path, old_name, new_name }) => {
      try {
        const layout = readLayout(file_path);
        const tab = findTab(layout, old_name);
        if (!tab) return { content: [{ type: "text" as const, text: `Tab "${old_name}" not found` }], isError: true };
        if (findTab(layout, new_name)) return { content: [{ type: "text" as const, text: `Tab "${new_name}" already exists` }], isError: true };
        tab.name = new_name;
        writeLayout(file_path, layout);
        return { content: [{ type: "text" as const, text: `Renamed tab "${old_name}" → "${new_name}"` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  // ──────────────────────────────────────────────
  // DELETE TOOLS
  // ──────────────────────────────────────────────

  server.tool(
    "remove_widget",
    "Remove a widget from a tab",
    {
      file_path: z.string().describe("Path to the layout JSON file"),
      tab_name: z.string().describe("Tab containing the widget"),
      widget_title: z.string().describe("Title of the widget to remove"),
    },
    async ({ file_path, tab_name, widget_title }) => {
      try {
        const layout = readLayout(file_path);
        const tab = findTab(layout, tab_name);
        if (!tab) return { content: [{ type: "text" as const, text: `Tab "${tab_name}" not found` }], isError: true };

        const ci = tab.grid_layout.containers.findIndex((w) => w.title === widget_title);
        if (ci >= 0) {
          tab.grid_layout.containers.splice(ci, 1);
          writeLayout(file_path, layout);
          return { content: [{ type: "text" as const, text: `Removed widget "${widget_title}" from "${tab_name}"` }] };
        }

        const li = tab.grid_layout.layouts.findIndex((w) => w.title === widget_title);
        if (li >= 0) {
          tab.grid_layout.layouts.splice(li, 1);
          writeLayout(file_path, layout);
          return { content: [{ type: "text" as const, text: `Removed layout "${widget_title}" from "${tab_name}"` }] };
        }

        // Check inside layout children
        for (const layoutWidget of tab.grid_layout.layouts) {
          if (layoutWidget.children) {
            const childIdx = layoutWidget.children.findIndex((w) => w.title === widget_title);
            if (childIdx >= 0) {
              layoutWidget.children.splice(childIdx, 1);
              writeLayout(file_path, layout);
              return { content: [{ type: "text" as const, text: `Removed "${widget_title}" from layout "${layoutWidget.title}"` }] };
            }
          }
        }

        return { content: [{ type: "text" as const, text: `Widget "${widget_title}" not found in tab "${tab_name}"` }], isError: true };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    "remove_tab",
    "Remove a tab from the layout",
    {
      file_path: z.string().describe("Path to the layout JSON file"),
      tab_name: z.string().describe("Name of the tab to remove"),
    },
    async ({ file_path, tab_name }) => {
      try {
        const layout = readLayout(file_path);
        const idx = layout.tabs.findIndex((t) => t.name === tab_name);
        if (idx < 0) return { content: [{ type: "text" as const, text: `Tab "${tab_name}" not found` }], isError: true };
        layout.tabs.splice(idx, 1);
        writeLayout(file_path, layout);
        return { content: [{ type: "text" as const, text: `Removed tab "${tab_name}"` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  // ──────────────────────────────────────────────
  // REORGANIZE TOOLS
  // ──────────────────────────────────────────────

  server.tool(
    "auto_layout",
    "Automatically arrange all widgets in a tab into a clean grid layout",
    {
      file_path: z.string().describe("Path to the layout JSON file"),
      tab_name: z.string().describe("Tab to reorganize"),
      max_columns: z.number().int().positive().optional().describe("Maximum columns in the grid (default: 10)"),
    },
    async ({ file_path, tab_name, max_columns }) => {
      try {
        const layout = readLayout(file_path);
        const tab = findTab(layout, tab_name);
        if (!tab) return { content: [{ type: "text" as const, text: `Tab "${tab_name}" not found` }], isError: true };

        const gs = layout.grid_size;
        const cols = max_columns ?? 10;
        const allWidgets: WidgetContainer[] = [
          ...tab.grid_layout.containers,
          ...tab.grid_layout.layouts,
        ];

        // Sort by original position for stability
        allWidgets.sort((a, b) => a.y - b.y || a.x - b.x);

        const placed: Array<{ x: number; y: number; width: number; height: number }> = [];
        for (const widget of allWidgets) {
          const pos = findNextAvailablePosition(placed, widget.width, widget.height, gs, cols);
          widget.x = pos.x;
          widget.y = pos.y;
          placed.push({ x: pos.x, y: pos.y, width: widget.width, height: widget.height });
        }

        writeLayout(file_path, layout);
        return { content: [{ type: "text" as const, text: `Reorganized ${allWidgets.length} widget(s) in "${tab_name}" into a ${cols}-column grid` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    "reorder_tabs",
    "Reorder tabs in the layout",
    {
      file_path: z.string().describe("Path to the layout JSON file"),
      tab_order: z.array(z.string()).describe("New tab order (list of tab names)"),
    },
    async ({ file_path, tab_order }) => {
      try {
        const layout = readLayout(file_path);
        const newTabs: Tab[] = [];
        for (const name of tab_order) {
          const tab = findTab(layout, name);
          if (!tab) return { content: [{ type: "text" as const, text: `Tab "${name}" not found` }], isError: true };
          newTabs.push(tab);
        }
        // Append any tabs not in the order list
        for (const tab of layout.tabs) {
          if (!tab_order.includes(tab.name)) {
            newTabs.push(tab);
          }
        }
        layout.tabs = newTabs;
        writeLayout(file_path, layout);
        return { content: [{ type: "text" as const, text: `Tabs reordered: ${layout.tabs.map((t) => t.name).join(", ")}` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  // ──────────────────────────────────────────────
  // CONFIGURATION TOOLS
  // ──────────────────────────────────────────────

  server.tool(
    "get_config",
    "Get the current MCP server configuration (tunable patterns, defaults, NT4 settings)",
    {},
    async () => {
      return { content: [{ type: "text" as const, text: JSON.stringify(config.get(), null, 2) }] };
    },
  );

  server.tool(
    "set_config",
    "Update MCP server configuration",
    {
      tunable_topic_patterns: z.array(z.string()).optional().describe("Glob patterns for tunable topics"),
      ignored_topic_patterns: z.array(z.string()).optional().describe("Glob patterns for topics to ignore"),
      show_submit_button: z.boolean().optional().describe("Default show_submit_button for Text Display widgets"),
      period: z.number().optional().describe("Default update period"),
      graph_period: z.number().optional().describe("Default graph update period"),
      nt_enabled: z.boolean().optional().describe("Enable NT4 connection"),
      nt_connection_mode: z.enum(["team_number", "roborio_mdns", "localhost", "custom"]).optional(),
      nt_team_number: z.number().int().optional().describe("FRC team number"),
      nt_ip_address: z.string().optional().describe("Custom IP address for NT4"),
    },
    async (params) => {
      try {
        const updates: any = {};
        if (params.tunable_topic_patterns !== undefined) updates.tunable_topic_patterns = params.tunable_topic_patterns;
        if (params.ignored_topic_patterns !== undefined) updates.ignored_topic_patterns = params.ignored_topic_patterns;

        const defaults: any = {};
        if (params.show_submit_button !== undefined) defaults.show_submit_button = params.show_submit_button;
        if (params.period !== undefined) defaults.period = params.period;
        if (params.graph_period !== undefined) defaults.graph_period = params.graph_period;
        if (Object.keys(defaults).length > 0) updates.defaults = defaults;

        const nt: any = {};
        if (params.nt_enabled !== undefined) nt.enabled = params.nt_enabled;
        if (params.nt_connection_mode !== undefined) nt.connection_mode = params.nt_connection_mode;
        if (params.nt_team_number !== undefined) nt.team_number = params.nt_team_number;
        if (params.nt_ip_address !== undefined) nt.ip_address = params.nt_ip_address;
        if (Object.keys(nt).length > 0) updates.network_tables = nt;

        const updated = config.update(updates);
        return { content: [{ type: "text" as const, text: `Configuration updated:\n${JSON.stringify(updated, null, 2)}` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  // ──────────────────────────────────────────────
  // UTILITY TOOLS
  // ──────────────────────────────────────────────

  server.tool(
    "convert_color",
    "Convert between hex color strings and Elastic Dashboard's decimal ARGB integers",
    {
      value: z.string().describe("Hex color (e.g., '#FF4CAF50', '#4CAF50') or decimal integer as string"),
    },
    async ({ value }) => {
      try {
        const num = Number(value);
        if (!isNaN(num) && num >= 0) {
          const hex = argbIntToHex(num);
          return { content: [{ type: "text" as const, text: `${num} → ${hex}` }] };
        }
        const intVal = hexToArgbInt(value);
        return { content: [{ type: "text" as const, text: `${value} → ${intVal}` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    "suggest_widget",
    "Suggest the best widget type for a given NT data type and topic",
    {
      nt_data_type: z.string().describe("NetworkTables data type (boolean, int, double, string, etc.)"),
      topic: z.string().optional().describe("Topic path to check against tunable patterns"),
    },
    async ({ nt_data_type, topic }) => {
      const isTunable = topic ? config.isTunableTopic(topic) : false;
      const suggested = suggestWidgetType(nt_data_type, isTunable);
      const info = getWidgetTypeInfo(suggested);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                suggested_type: suggested,
                is_tunable: isTunable,
                default_size: info ? `${info.defaultWidth}x${info.defaultHeight}` : "1x1",
                properties: info?.properties.map((p) => ({
                  name: p.name,
                  type: p.type,
                  default: p.defaultValue,
                })),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  return server;
}
