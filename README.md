# elastic-dashboard-mcp

An MCP (Model Context Protocol) server for creating and editing [Elastic Dashboard](https://github.com/Gold872/elastic_dashboard) layout JSON files. Designed for FRC teams to programmatically build competition dashboard layouts using AI assistants like GitHub Copilot.

## Features

- **Full Elastic Dashboard schema support** — all 35+ widget types with correct sizes, properties, and validation
- **Smart auto-layout** — widgets are automatically positioned on the grid without overlaps
- **Tunable topic awareness** — configure patterns to distinguish read-only vs. editable topics (AdvantageKit, custom tuning systems)
- **Batch operations** — add multiple widgets at once with automatic grid placement
- **Layout validation** — catch errors before loading in Elastic Dashboard
- **Color conversion** — convert between hex and Elastic's decimal ARGB format

## Installation

Install from GitHub Packages:

```bash
npm install @o-bots7160/elastic-dashboard-mcp --registry=https://npm.pkg.github.com
```

Or build from source:

```bash
git clone https://github.com/o-bots7160/elastic_dashboard-mcp.git
cd elastic_dashboard-mcp
npm install && npm run build
```

## Usage with VS Code / GitHub Copilot

Add to your `.vscode/mcp.json`:

```json
{
  "servers": {
    "elastic-dashboard": {
      "command": "npx",
      "args": [
        "-y",
        "--registry=https://npm.pkg.github.com",
        "@o-bots7160/elastic-dashboard-mcp"
      ]
    }
  }
}
```

## Available Tools

### Read / Inspect
- **`get_layout`** — Read a layout file and get a summary of tabs and widgets
- **`get_tab`** — Get full details of a specific tab
- **`validate_layout`** — Check a layout against schema rules
- **`list_widget_types`** — List all available widget types with properties and sizes

### Create
- **`create_layout`** — Create a new empty layout file
- **`add_tab`** — Add a tab to an existing layout
- **`add_widget`** — Add a widget with auto-positioning
- **`add_widgets_batch`** — Add multiple widgets at once

### Modify
- **`move_widget`** — Move a widget to a new grid position
- **`resize_widget`** — Resize a widget
- **`update_widget_properties`** — Change widget properties
- **`rename_tab`** — Rename a tab

### Delete
- **`remove_widget`** — Remove a widget from a tab
- **`remove_tab`** — Remove a tab

### Reorganize
- **`auto_layout`** — Rearrange all widgets into a clean grid
- **`reorder_tabs`** — Change tab order

### Configuration
- **`get_config`** — View current configuration
- **`set_config`** — Update tunable patterns, defaults, and NT4 settings

### Utilities
- **`convert_color`** — Convert between hex colors and Elastic's decimal ARGB format
- **`suggest_widget`** — Get the best widget type for a given NT data type

## Configuration

Create a `.elastic-mcp-config.json` in your project root:

```json
{
  "tunable_topic_patterns": ["/Tuning/**"],
  "ignored_topic_patterns": ["/.metadata/**"],
  "defaults": {
    "show_submit_button": true,
    "period": 0.06,
    "graph_period": 0.033
  }
}
```

## Development

```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode
npm test             # Run tests
npm run test:watch   # Watch tests
```
