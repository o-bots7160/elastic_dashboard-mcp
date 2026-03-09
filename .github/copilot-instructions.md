# Copilot Instructions — elastic_dashboard-mcp

## Project Overview

This is a TypeScript MCP (Model Context Protocol) server that manipulates [Elastic Dashboard](https://github.com/Gold872/elastic_dashboard) layout JSON files. It enables AI assistants to programmatically create, modify, and reorganize FRC (FIRST Robotics Competition) dashboard layouts — adding tabs, placing widgets, adjusting sizes/positions, and reorganizing page layouts.

Elastic Dashboard is a Flutter-based FRC driver dashboard that stores its layout as a JSON file. This MCP server provides tools to work with that JSON schema without needing the Elastic Dashboard GUI.

### FRC Team Workflow Context

FRC teams typically store Elastic layout JSON files in their robot code repository's deploy directory so they can be downloaded onto the robot and loaded remotely. The MCP server should be able to read/write these files from any path the user specifies. A common pattern is `src/main/deploy/elastic-layout.json` in a Gradle-based WPILib robot project.

## Elastic Dashboard Layout JSON Schema

### Top-Level Structure

```json
{
  "version": 1.0,
  "grid_size": 128,
  "tabs": [
    {
      "name": "Tab Name",
      "grid_layout": {
        "layouts": [],
        "containers": []
      }
    }
  ]
}
```

- **`version`**: Always `1.0` (number, not string).
- **`grid_size`**: Base unit for the coordinate grid in pixels (default: `128`). All widget positions and sizes should be multiples of this value.
- **`tabs`**: Array of tab objects. Each has a `name` (string) and `grid_layout` object.
- **`grid_layout.containers`**: Array of individual widgets placed directly on the grid.
- **`grid_layout.layouts`**: Array of layout widgets (like "List Layout") that group child widgets.

### Widget (Container) Structure

Every widget in `containers` follows this shape:

```json
{
  "title": "Widget Title",
  "x": 0.0,
  "y": 0.0,
  "width": 128.0,
  "height": 128.0,
  "type": "Widget Type Name",
  "properties": {
    "topic": "/SmartDashboard/TopicName",
    "period": 0.06
  }
}
```

- **`title`** (string): Display label shown on the widget's title bar.
- **`x`, `y`** (float): Position on the grid (top-left origin), in pixels. Should be non-negative multiples of `grid_size`.
- **`width`, `height`** (float): Size in pixels. Must be at least the widget's minimum size (see table below). Should be multiples of `grid_size`.
- **`type`** (string): Must **exactly** match one of the registered widget type names. Case-sensitive.
- **`properties`** (object): Widget-specific configuration. Every widget has at least:
  - **`topic`** (string): NetworkTables topic path (e.g., `/SmartDashboard/MyValue`, `/FMSInfo`).
  - **`period`** (float): Update frequency in seconds. Default is `0.06` for most widgets, `0.033` for `Graph`.

Some single-topic widgets may also include optional fields:
- **`data_type`** (string, optional): NT4 data type (e.g., `"boolean"`, `"double"`, `"string"`).
- **`struct_meta`** (object, optional): For struct-typed topics, contains `schema_name` and `path`.

### Layout Widget Structure

Layout widgets go in `grid_layout.layouts` and have a `children` array containing widget objects:

```json
{
  "title": "My List",
  "x": 0.0,
  "y": 0.0,
  "width": 256.0,
  "height": 256.0,
  "type": "List Layout",
  "properties": {
    "label_position": "TOP"
  },
  "children": [
    {
      "title": "Child Widget",
      "x": 0.0,
      "y": 0.0,
      "width": 128.0,
      "height": 128.0,
      "type": "Boolean Box",
      "properties": {
        "topic": "/SmartDashboard/MyBool",
        "period": 0.06
      }
    }
  ]
}
```

Children inside a List Layout have `x`/`y` set to `0.0` (position is managed by the list, not the grid). Their `width`/`height` are still used for internal rendering constraints.

### Available Widget Types — Exact Names, Sizes, and Properties

The `type` field must be one of the exact strings below. The `_normalSize` base unit is 128 pixels.

#### Single-Topic Widgets

| Exact `type` String | Aliases Accepted | Min Width | Min Height | Default Size (grid units) | Key Properties |
|---|---|---|---|---|---|
| `Text Display` | `Text View` | 1×1 | 1×1 | 1×1 | `show_submit_button` (bool) |
| `Large Text Display` | — | 1×1 | ~0.8×1 | 1×1 | — |
| `Number Slider` | — | 1×1 | 1×1 | 1×1 | `min_value` (float, -1.0), `max_value` (float, 1.0), `divisions` (int, 5), `update_continuously` (bool, false) |
| `Number Bar` | — | 1×1 | 1×1 | 1×1 | `min_value` (float, -1.0), `max_value` (float, 1.0), `divisions` (int, 5), `inverted` (bool, false), `orientation` ("horizontal" or "vertical") |
| `Voltage View` | — | 1×1 | 1×1 | 1×1 | `min_value` (float, 4.0), `max_value` (float, 13.0), `divisions` (int, 5), `inverted` (bool, false), `orientation` ("horizontal" or "vertical") |
| `Radial Gauge` | `Simple Dial` | ~1.6×1 | ~1.6×1 | 1×1 | `start_angle` (float, -140.0), `end_angle` (float, 140.0), `min_value` (float, 0.0), `max_value` (float, 100.0), `number_of_labels` (int, 8), `wrap_value` (bool, false), `show_pointer` (bool, true), `show_ticks` (bool, true) |
| `Graph` | — | 2×1 | 2×1 | 1×1 | `time_displayed` (float, 5.0), `min_value` (float, optional), `max_value` (float, optional), `color` (int, 0xAARRGGBB), `line_width` (float, 2.0). **Default period is `0.033`**. |
| `Match Time` | — | 1×1 | 1×1 | 1×1 | `time_display_mode` ("Minutes and Seconds" or "Seconds Only"), `red_start_time` (int, 15), `yellow_start_time` (int, 30) |
| `Boolean Box` | — | 1×1 | 1×1 | 1×1 | `true_color` (int, 0xAARRGGBB), `false_color` (int, 0xAARRGGBB), `true_icon` ("None" or "Checkmark"), `false_icon` ("None", "Checkmark", or "X") |
| `Toggle Button` | — | 1×1 | ~0.8×1 | 1×1 | — |
| `Toggle Switch` | — | 1×1 | 1×1 | 1×1 | — |
| `Single Color View` | — | 1×1 | 1×1 | 1×1 | Topic value must be a hex string like `"#RRGGBB"` |
| `Multi Color View` | — | 1×1 | 1×1 | 1×1 | Topic value must be a string array of `"#RRGGBB"` |

#### Multi-Topic Widgets

| Exact `type` String | Aliases Accepted | Min Width | Min Height | Default Size (grid units) | Key Properties |
|---|---|---|---|---|---|
| `Accelerometer` | — | 1×1 | 1×1 | 1×1 | — |
| `3-Axis Accelerometer` | `3AxisAccelerometer` | 1×1 | 1×1 | 1×1 | — |
| `Camera Stream` | — | 2×1 | 2×1 | 2×2 | `compression` (int, 0-100), `fps` (int), `resolution` (int[]), `rotation_turns` (int) |
| `ComboBox Chooser` | `String Chooser` | 1×1 | ~0.85×1 | 1×1 | `sort_options` (bool, false) |
| `Split Button Chooser` | — | 1×1 | 1×1 | 1×1 | — |
| `Scheduler` | — | 2×1 | 2×1 | 2×3 | — |
| `Command` | — | 2×1 | ~0.9×1 | 2×1 | `show_type` (bool, true), `maximize_button_space` (bool) |
| `Subsystem` | — | 2×1 | 1×1 | 2×1 | — |
| `DifferentialDrive` | `Differential Drivebase` | 2×1 | 2×1 | 3×2 | — |
| `SwerveDrive` | — | 2×1 | 2×1 | 2×2 | `show_robot_rotation` (bool, true), `rotation_unit` ("Radians", "Degrees", or "Rotations") |
| `YAGSL Swerve Drive` | — | 2×1 | 2×1 | 2×2 | Same as SwerveDrive but rotation unit is automatic |
| `Encoder` | `Quadrature Encoder` | 2×1 | ~0.86×1 | 2×1 | — |
| `Field` | `Field2d` | 2×1 | 2×1 | 2×2 | `field_game` (string: "Rebuilt", "Reefscape", "Crescendo", "Charged Up", "Rapid React", "Infinite Recharge", "Destination: Deep Space", "Power Up"), `robot_width` (float, 0.85m), `robot_length` (float, 0.85m), `show_other_objects` (bool, true), `show_trajectories` (bool, true), `field_rotation` (float, 0.0°), `robot_color` (int, 0xAARRGGBB), `trajectory_color` (int, 0xAARRGGBB), `show_robot_outside_widget` (bool, true) |
| `FMSInfo` | — | 3×1 | 1×1 | 3×1 | Topic is usually `/FMSInfo` |
| `Gyro` | — | 2×1 | 2×1 | 2×2 | `counter_clockwise_positive` (bool, false) |
| `Motor Controller` | `Nidec Brushless` | 1×1 | ~0.92×1 | 1×1 | — |
| `Alerts` | — | 2×1 | 2×1 | 2×3 | — |
| `PIDController` | `PID Controller` | 2×1 | 3×1 | 2×3 | — |
| `ProfiledPIDController` | — | 2×1 | 3×1 | 2×3 | — |
| `PowerDistribution` | `PDP` | 3×1 | 3×1 | 3×4 | — |
| `Relay` | — | 1×1 | 2×1 | 1×2 | — |
| `RobotPreferences` | — | 2×1 | 2×1 | 2×3 | Topic is usually `/Preferences` |
| `Ultrasonic` | — | 2×1 | 1×1 | 2×1 | — |

> **Size notation**: "2×1" means 2 `grid_size` units wide by 1 `grid_size` unit tall. With default `grid_size` of 128, that's 256×128 pixels.

#### Layout Types

| Exact `type` String | Purpose | Key Properties |
|---|---|---|
| `List Layout` | Vertical scrollable list of child widgets | `label_position` ("TOP", "BOTTOM", "LEFT", "RIGHT", or "HIDDEN") |

List Layouts go in `grid_layout.layouts` (not `containers`). Min size is 2×2 grid units (256×256 px).

### Color Format

Colors are stored as **decimal** 32-bit integers representing `0xAARRGGBB`:
- Green: `4283215696` → `0xFF4CAF50`
- Red: `4294198070` → `0xFFF44336`
- White: `4294967295` → `0xFFFFFFFF`
- Light Blue: `4278238420` → `0xFF03DAC4`

To convert hex to the integer: `0xFF4CAF50` = `4283215696` in decimal. Alpha is typically `0xFF` (fully opaque).

### NetworkTables Topic Conventions

Common topic path prefixes:
- `/SmartDashboard/` — most user-published values
- `/FMSInfo` — FMS match data (auto-published by WPILib)
- `/CameraPublisher/` — camera streams
- `/Preferences` — robot preferences
- `/LiveWindow/` — test mode data

### Complete Example Layout

```json
{
  "version": 1.0,
  "grid_size": 128,
  "tabs": [
    {
      "name": "Teleoperated",
      "grid_layout": {
        "layouts": [],
        "containers": [
          {
            "title": "Drive Speed",
            "x": 0.0,
            "y": 0.0,
            "width": 256.0,
            "height": 128.0,
            "type": "Number Bar",
            "properties": {
              "topic": "/SmartDashboard/Drive Speed",
              "period": 0.06,
              "min_value": -1.0,
              "max_value": 1.0,
              "divisions": 5,
              "inverted": false,
              "orientation": "horizontal"
            }
          },
          {
            "title": "Match Time",
            "x": 256.0,
            "y": 0.0,
            "width": 128.0,
            "height": 128.0,
            "type": "Match Time",
            "properties": {
              "topic": "/SmartDashboard/Match Time",
              "period": 0.06,
              "time_display_mode": "Minutes and Seconds",
              "red_start_time": 15,
              "yellow_start_time": 30
            }
          }
        ]
      }
    }
  ]
}
```

## MCP Server Architecture

### User Configuration

The MCP server should support persistent user configuration (e.g., via a config file or MCP server arguments) for the following defaults:

#### Tunable Topic Namespaces

FRC teams using AdvantageKit, AdvantageScope, or custom tuning systems often publish "tunable" values alongside read-only telemetry values on NetworkTables. This results in duplicate-looking entries under different topic prefixes (e.g., `/SmartDashboard/Drive/kP` for display vs. `/Tuning/Drive/kP` for editing).

The user should be able to configure:
- **Tunable topic patterns**: One or more glob or prefix patterns that identify which NT topics should be treated as editable/tunable (e.g., `"/Tuning/**"`, `"/SmartDashboard/Tunables/*"`). When creating widgets for topics matching these patterns, the MCP server should default to editable widget types (`Text Display`, `Number Slider`) rather than read-only types (`Number Bar`, `Large Text Display`).
- **Ignored topic patterns**: Patterns for topics that should be excluded when auto-populating a layout (e.g., `"/SmartDashboard/.type"`, `"/.metadata/**"`), to filter out internal NT entries that aren't useful for dashboard display.

#### Default Widget Behaviors

- **`show_submit_button`**: Whether `Text Display` widgets should have submit buttons enabled by default (`true` or `false`). Teams that want explicit confirmation before publishing values to NT should set this to `true`. Default: `false`.
- **Default `period`**: Override the default update period for widgets (default: `0.06`).
- **Default `graph_period`**: Override the default graph update period (default: `0.033`).

Example configuration shape:

```json
{
  "tunable_topic_patterns": ["/Tuning/**", "/SmartDashboard/Tunables/**"],
  "ignored_topic_patterns": ["/SmartDashboard/.type", "/.metadata/**"],
  "defaults": {
    "show_submit_button": true,
    "period": 0.06,
    "graph_period": 0.033
  },
  "network_tables": {
    "enabled": false,
    "connection_mode": "team_number",
    "team_number": 9999,
    "ip_address": "10.99.99.2"
  }
}
```

When creating widgets, the MCP server should check if the widget's topic matches a tunable pattern and apply appropriate defaults (editable widget type, submit button setting, etc.).

### NetworkTables 4 (NT4) Live Connection (Optional)

The MCP server can optionally connect to a robot or simulator via the NT4 WebSocket protocol for live topic discovery and smart layout generation. This is opt-in — all JSON editing features work without a connection.

#### Connection Configuration

NT4 connects over WebSocket on port `5810`. The server address can be resolved several ways:

| Connection Mode | Address | Use Case |
|---|---|---|
| `team_number` | `10.TE.AM.2` (e.g., team 353 → `10.3.53.2`) | Competition/practice with roboRIO |
| `roborio_mdns` | `roboRIO-{team}-FRC.local` | mDNS on practice field |
| `localhost` | `127.0.0.1` | Robot simulation on local machine |
| `custom` | Any IP/hostname | Custom setups |

WebSocket URL format: `ws://{address}:5810/nt/{client_name}`

The client name should be something like `elastic-mcp` to identify this connection in NT diagnostics.

#### Recommended TypeScript Library

Use [`ntcore-ts-client`](https://github.com/cjlawson02/ntcore-ts) (`npm install ntcore-ts-client`):

```typescript
import { NetworkTables } from 'ntcore-ts-client';

// Connect by team number
const nt = NetworkTables.getInstanceByTeam(353);

// Or by URI
const nt = NetworkTables.getInstanceByURI('127.0.0.1');
```

#### NT4 Protocol Essentials

- **Topics**: Named data channels (e.g., `/SmartDashboard/Drive Speed`). Each topic has a type and properties.
- **Subscribe**: Clients subscribe to topic prefixes to receive value updates. Subscribe to `""` (empty string) with `topicsOnly: true` to discover all announced topics without receiving values.
- **Data types**: `boolean`, `int`, `float`, `double`, `string`, `boolean[]`, `double[]`, `int[]`, `float[]`, `string[]`, `raw`, `json`, `msgpack`, `protobuf`, `struct:{name}`, `struct:{name}[]`
- **Control messages**: JSON text frames (publish, subscribe, announce, unannounce, properties)
- **Value messages**: MessagePack binary frames

#### Topic-to-Widget Type Mapping

When discovering live topics, map NT4 data types to appropriate widget types:

| NT4 Data Type | Read-Only Widget | Editable Widget (tunable) |
|---|---|---|
| `boolean` | `Boolean Box` | `Toggle Switch` or `Toggle Button` |
| `int`, `float`, `double` | `Number Bar` or `Graph` | `Number Slider` or `Text Display` |
| `string` | `Large Text Display` | `Text Display` |
| `boolean[]`, `double[]`, `int[]`, `float[]`, `string[]` | `Text Display` | `Text Display` |

For multi-topic Sendable types (detected by the presence of a `.type` sub-key under a topic path), use the Sendable type name to select the widget:

| `.type` Value | Widget Type |
|---|---|
| `"String Chooser"` | `ComboBox Chooser` |
| `"DifferentialDrive"` | `DifferentialDrive` |
| `"SwerveDrive"` | `SwerveDrive` |
| `"Gyro"` | `Gyro` |
| `"Field2d"` | `Field` |
| `"PIDController"` | `PIDController` |
| `"ProfiledPIDController"` | `ProfiledPIDController` |
| `"FMSInfo"` | `FMSInfo` |
| `"PowerDistribution"` or `"PDP"` | `PowerDistribution` |
| `"Encoder"` or `"Quadrature Encoder"` | `Encoder` |
| `"Motor Controller"` or `"Nidec Brushless"` | `Motor Controller` |
| `"Relay"` | `Relay` |
| `"Ultrasonic"` | `Ultrasonic` |
| `"Accelerometer"` | `Accelerometer` |
| `"3AxisAccelerometer"` | `3-Axis Accelerometer` |
| `"RobotPreferences"` | `RobotPreferences` |
| `"Scheduler"` | `Scheduler` |
| `"Subsystem"` | `Subsystem` |
| `"Command"` | `Command` |

#### MCP Tools for NT4

When NT4 is enabled, expose additional tools:

- **`nt_connect`** / **`nt_disconnect`**: Manage the connection lifecycle.
- **`nt_list_topics`**: List all announced topics with their types and current values. Support filtering by prefix pattern.
- **`nt_get_topic_value`**: Read the current value of a specific topic.
- **`nt_suggest_widgets`**: Given a topic prefix or set of topics, suggest appropriate widget types and a layout.
- **`nt_auto_populate_tab`**: Discover topics matching a pattern and auto-generate a tab with correctly-typed widgets arranged in a grid.

These tools should work alongside the existing JSON editing tools — for example, a user might discover topics via NT4, then use the layout tools to create/save a JSON file for their deploy directory.

### Tool Design

The MCP server should expose tools for these categories of operations:

- **Read/inspect**: List tabs, list widgets on a tab, get widget details/properties
- **Create**: Add a new tab, add a widget to a tab, create a layout group, create an entire layout from scratch
- **Modify**: Move a widget, resize a widget, change widget properties, rename a tab
- **Delete**: Remove a widget, remove a tab
- **Reorganize**: Auto-layout widgets in a grid pattern, reorder tabs
- **Configure**: Set/get tunable topic patterns, ignored topic patterns, and default widget behaviors

### Validation Rules

When creating or modifying widgets, enforce:
1. Widget positions (`x`, `y`) must be non-negative multiples of `grid_size`
2. Widget dimensions (`width`, `height`) must meet the widget type's minimum size and be multiples of `grid_size`
3. Widgets must not overlap on the same tab (check bounding rectangles)
4. Widget `type` must exactly match one of the registered type names (case-sensitive)
5. The `topic` property is required for all widgets
6. Tab names should be unique within a layout
7. `version` must be `1.0`

### File I/O

The MCP server reads and writes `.json` layout files. Common locations:
- `src/main/deploy/elastic-layout.json` (WPILib Gradle project deploy directory)
- Any user-specified path
- Elastic Dashboard exports files with `.json` extension

The JSON should be pretty-printed with 2-space indentation when writing (matching Elastic Dashboard's export format).

## Build & Development

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Run in development mode
npm test             # Run full test suite
npm run test -- --grep "pattern"  # Run a single test by name
```

## Releasing

After pushing a new feature or bug fix that changes runtime behavior (source code in `src/`, dependency changes, etc.), create a release to publish to npm. Do **not** release for documentation-only changes (README, copilot-instructions, comments).

```bash
npm version patch    # or minor/major — bumps package.json and creates a git tag
git push && git push --tags
gh release create v$(node -p "require('./package.json').version") --generate-notes
```

The `publish.yml` workflow will automatically build, test, and publish the package to npm on release.

## References

- [Elastic Dashboard GitHub](https://github.com/Gold872/elastic_dashboard)
- [Elastic Dashboard Documentation](https://frc-elastic.gitbook.io/docs)
- [Widgets & Properties Reference](https://frc-elastic.gitbook.io/docs/additional-features-and-references/widgets-list-and-properties-reference)
- [Custom Widget Examples](https://frc-elastic.gitbook.io/docs/additional-features-and-references/custom-widget-examples)
- [MCP Specification](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
