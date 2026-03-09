// Widget registry: exact type names, minimum sizes, default sizes, and properties

export interface WidgetTypeInfo {
  type: string;
  aliases: string[];
  category: "single-topic" | "multi-topic" | "layout";
  minWidth: number; // in grid units
  minHeight: number;
  defaultWidth: number; // in grid units
  defaultHeight: number;
  properties: PropertyDef[];
}

export interface PropertyDef {
  name: string;
  type: "boolean" | "number" | "string" | "integer" | "color";
  defaultValue?: unknown;
  description?: string;
  options?: string[]; // for enum-style string properties
}

const WIDGET_REGISTRY: WidgetTypeInfo[] = [
  // === Single-Topic Widgets ===
  {
    type: "Text Display",
    aliases: ["Text View"],
    category: "single-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [
      { name: "show_submit_button", type: "boolean", defaultValue: false, description: "Show button to publish entered data" },
    ],
  },
  {
    type: "Large Text Display",
    aliases: [],
    category: "single-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [],
  },
  {
    type: "Number Slider",
    aliases: [],
    category: "single-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [
      { name: "min_value", type: "number", defaultValue: -1.0 },
      { name: "max_value", type: "number", defaultValue: 1.0 },
      { name: "divisions", type: "integer", defaultValue: 5 },
      { name: "update_continuously", type: "boolean", defaultValue: false },
    ],
  },
  {
    type: "Number Bar",
    aliases: [],
    category: "single-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [
      { name: "min_value", type: "number", defaultValue: -1.0 },
      { name: "max_value", type: "number", defaultValue: 1.0 },
      { name: "divisions", type: "integer", defaultValue: 5 },
      { name: "inverted", type: "boolean", defaultValue: false },
      { name: "orientation", type: "string", defaultValue: "horizontal", options: ["horizontal", "vertical"] },
    ],
  },
  {
    type: "Voltage View",
    aliases: [],
    category: "single-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [
      { name: "min_value", type: "number", defaultValue: 4.0 },
      { name: "max_value", type: "number", defaultValue: 13.0 },
      { name: "divisions", type: "integer", defaultValue: 5 },
      { name: "inverted", type: "boolean", defaultValue: false },
      { name: "orientation", type: "string", defaultValue: "horizontal", options: ["horizontal", "vertical"] },
    ],
  },
  {
    type: "Radial Gauge",
    aliases: ["Simple Dial"],
    category: "single-topic",
    minWidth: 2, minHeight: 2, defaultWidth: 2, defaultHeight: 2,
    properties: [
      { name: "start_angle", type: "number", defaultValue: -140.0 },
      { name: "end_angle", type: "number", defaultValue: 140.0 },
      { name: "min_value", type: "number", defaultValue: 0.0 },
      { name: "max_value", type: "number", defaultValue: 100.0 },
      { name: "number_of_labels", type: "integer", defaultValue: 8 },
      { name: "wrap_value", type: "boolean", defaultValue: false },
      { name: "show_pointer", type: "boolean", defaultValue: true },
      { name: "show_ticks", type: "boolean", defaultValue: true },
    ],
  },
  {
    type: "Graph",
    aliases: [],
    category: "single-topic",
    minWidth: 2, minHeight: 2, defaultWidth: 2, defaultHeight: 2,
    properties: [
      { name: "time_displayed", type: "number", defaultValue: 5.0 },
      { name: "min_value", type: "number", description: "Optional min Y value" },
      { name: "max_value", type: "number", description: "Optional max Y value" },
      { name: "color", type: "color", defaultValue: 4278238420, description: "Line color (0xAARRGGBB as decimal)" },
      { name: "line_width", type: "number", defaultValue: 2.0 },
    ],
  },
  {
    type: "Match Time",
    aliases: [],
    category: "single-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [
      { name: "time_display_mode", type: "string", defaultValue: "Minutes and Seconds", options: ["Minutes and Seconds", "Seconds Only"] },
      { name: "red_start_time", type: "integer", defaultValue: 15 },
      { name: "yellow_start_time", type: "integer", defaultValue: 30 },
    ],
  },
  {
    type: "Boolean Box",
    aliases: [],
    category: "single-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [
      { name: "true_color", type: "color", defaultValue: 4283215696, description: "Color when true (0xAARRGGBB)" },
      { name: "false_color", type: "color", defaultValue: 4294198070, description: "Color when false (0xAARRGGBB)" },
      { name: "true_icon", type: "string", defaultValue: "None", options: ["None", "Checkmark"] },
      { name: "false_icon", type: "string", defaultValue: "None", options: ["None", "Checkmark", "X"] },
    ],
  },
  {
    type: "Toggle Button",
    aliases: [],
    category: "single-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [],
  },
  {
    type: "Toggle Switch",
    aliases: [],
    category: "single-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [],
  },
  {
    type: "Single Color View",
    aliases: [],
    category: "single-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [],
  },
  {
    type: "Multi Color View",
    aliases: [],
    category: "single-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [],
  },

  // === Multi-Topic Widgets ===
  {
    type: "Accelerometer",
    aliases: [],
    category: "multi-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [],
  },
  {
    type: "3-Axis Accelerometer",
    aliases: ["3AxisAccelerometer"],
    category: "multi-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [],
  },
  {
    type: "Camera Stream",
    aliases: [],
    category: "multi-topic",
    minWidth: 2, minHeight: 2, defaultWidth: 2, defaultHeight: 2,
    properties: [
      { name: "compression", type: "integer", description: "Image quality 0-100" },
      { name: "fps", type: "integer", description: "Frames per second" },
      { name: "rotation_turns", type: "integer", defaultValue: 0 },
    ],
  },
  {
    type: "ComboBox Chooser",
    aliases: ["String Chooser"],
    category: "multi-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 2, defaultHeight: 1,
    properties: [
      { name: "sort_options", type: "boolean", defaultValue: false },
    ],
  },
  {
    type: "Split Button Chooser",
    aliases: [],
    category: "multi-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 2, defaultHeight: 1,
    properties: [],
  },
  {
    type: "Scheduler",
    aliases: [],
    category: "multi-topic",
    minWidth: 2, minHeight: 2, defaultWidth: 2, defaultHeight: 3,
    properties: [],
  },
  {
    type: "Command",
    aliases: [],
    category: "multi-topic",
    minWidth: 2, minHeight: 1, defaultWidth: 2, defaultHeight: 1,
    properties: [
      { name: "show_type", type: "boolean", defaultValue: true },
      { name: "maximize_button_space", type: "boolean", defaultValue: false },
    ],
  },
  {
    type: "Subsystem",
    aliases: [],
    category: "multi-topic",
    minWidth: 2, minHeight: 1, defaultWidth: 2, defaultHeight: 1,
    properties: [],
  },
  {
    type: "DifferentialDrive",
    aliases: ["Differential Drivebase"],
    category: "multi-topic",
    minWidth: 2, minHeight: 2, defaultWidth: 3, defaultHeight: 2,
    properties: [],
  },
  {
    type: "SwerveDrive",
    aliases: [],
    category: "multi-topic",
    minWidth: 2, minHeight: 2, defaultWidth: 2, defaultHeight: 2,
    properties: [
      { name: "show_robot_rotation", type: "boolean", defaultValue: true },
      { name: "rotation_unit", type: "string", defaultValue: "Radians", options: ["Radians", "Degrees", "Rotations"] },
    ],
  },
  {
    type: "YAGSL Swerve Drive",
    aliases: [],
    category: "multi-topic",
    minWidth: 2, minHeight: 2, defaultWidth: 2, defaultHeight: 2,
    properties: [
      { name: "show_robot_rotation", type: "boolean", defaultValue: true },
    ],
  },
  {
    type: "Encoder",
    aliases: ["Quadrature Encoder"],
    category: "multi-topic",
    minWidth: 2, minHeight: 1, defaultWidth: 2, defaultHeight: 1,
    properties: [],
  },
  {
    type: "Field",
    aliases: ["Field2d"],
    category: "multi-topic",
    minWidth: 2, minHeight: 2, defaultWidth: 2, defaultHeight: 2,
    properties: [
      { name: "field_game", type: "string", defaultValue: "Rebuilt", options: ["Rebuilt", "Reefscape", "Crescendo", "Charged Up", "Rapid React", "Infinite Recharge", "Destination: Deep Space", "Power Up"] },
      { name: "robot_width", type: "number", defaultValue: 0.85, description: "Robot width in meters" },
      { name: "robot_length", type: "number", defaultValue: 0.85, description: "Robot length in meters" },
      { name: "show_other_objects", type: "boolean", defaultValue: true },
      { name: "show_trajectories", type: "boolean", defaultValue: true },
      { name: "field_rotation", type: "number", defaultValue: 0.0, description: "Degrees, clockwise positive" },
      { name: "robot_color", type: "color", defaultValue: 4294198070 },
      { name: "trajectory_color", type: "color", defaultValue: 4294967295 },
      { name: "show_robot_outside_widget", type: "boolean", defaultValue: true },
    ],
  },
  {
    type: "FMSInfo",
    aliases: [],
    category: "multi-topic",
    minWidth: 3, minHeight: 1, defaultWidth: 3, defaultHeight: 1,
    properties: [],
  },
  {
    type: "Gyro",
    aliases: [],
    category: "multi-topic",
    minWidth: 2, minHeight: 2, defaultWidth: 2, defaultHeight: 2,
    properties: [
      { name: "counter_clockwise_positive", type: "boolean", defaultValue: false },
    ],
  },
  {
    type: "Motor Controller",
    aliases: ["Nidec Brushless"],
    category: "multi-topic",
    minWidth: 1, minHeight: 1, defaultWidth: 1, defaultHeight: 1,
    properties: [],
  },
  {
    type: "Alerts",
    aliases: [],
    category: "multi-topic",
    minWidth: 2, minHeight: 2, defaultWidth: 2, defaultHeight: 3,
    properties: [],
  },
  {
    type: "PIDController",
    aliases: ["PID Controller"],
    category: "multi-topic",
    minWidth: 2, minHeight: 3, defaultWidth: 2, defaultHeight: 3,
    properties: [],
  },
  {
    type: "ProfiledPIDController",
    aliases: [],
    category: "multi-topic",
    minWidth: 2, minHeight: 3, defaultWidth: 2, defaultHeight: 3,
    properties: [],
  },
  {
    type: "PowerDistribution",
    aliases: ["PDP"],
    category: "multi-topic",
    minWidth: 3, minHeight: 3, defaultWidth: 3, defaultHeight: 4,
    properties: [],
  },
  {
    type: "Relay",
    aliases: [],
    category: "multi-topic",
    minWidth: 1, minHeight: 2, defaultWidth: 1, defaultHeight: 2,
    properties: [],
  },
  {
    type: "RobotPreferences",
    aliases: [],
    category: "multi-topic",
    minWidth: 2, minHeight: 2, defaultWidth: 2, defaultHeight: 3,
    properties: [],
  },
  {
    type: "Ultrasonic",
    aliases: [],
    category: "multi-topic",
    minWidth: 2, minHeight: 1, defaultWidth: 2, defaultHeight: 1,
    properties: [],
  },

  // === Layout Types ===
  {
    type: "List Layout",
    aliases: [],
    category: "layout",
    minWidth: 2, minHeight: 2, defaultWidth: 2, defaultHeight: 3,
    properties: [
      { name: "label_position", type: "string", defaultValue: "TOP", options: ["TOP", "BOTTOM", "LEFT", "RIGHT", "HIDDEN"] },
    ],
  },
];

// Build lookup maps
const typeMap = new Map<string, WidgetTypeInfo>();
const aliasMap = new Map<string, WidgetTypeInfo>();

for (const info of WIDGET_REGISTRY) {
  typeMap.set(info.type, info);
  for (const alias of info.aliases) {
    aliasMap.set(alias, info);
  }
}

export function getWidgetTypeInfo(type: string): WidgetTypeInfo | undefined {
  return typeMap.get(type) ?? aliasMap.get(type);
}

export function resolveWidgetType(type: string): string {
  const info = getWidgetTypeInfo(type);
  return info?.type ?? type;
}

export function isValidWidgetType(type: string): boolean {
  return typeMap.has(type) || aliasMap.has(type);
}

export function getAllWidgetTypes(): WidgetTypeInfo[] {
  return [...WIDGET_REGISTRY];
}

export function getWidgetTypeNames(): string[] {
  return WIDGET_REGISTRY.map((w) => w.type);
}

export function getMinSize(type: string, gridSize: number): { width: number; height: number } {
  const info = getWidgetTypeInfo(type);
  if (!info) return { width: gridSize, height: gridSize };
  return {
    width: info.minWidth * gridSize,
    height: info.minHeight * gridSize,
  };
}

export function getDefaultSize(type: string, gridSize: number): { width: number; height: number } {
  const info = getWidgetTypeInfo(type);
  if (!info) return { width: gridSize, height: gridSize };
  return {
    width: info.defaultWidth * gridSize,
    height: info.defaultHeight * gridSize,
  };
}

/** Map NT4 sendable .type values to Elastic widget type names */
export const SENDABLE_TYPE_MAP: Record<string, string> = {
  "String Chooser": "ComboBox Chooser",
  "DifferentialDrive": "DifferentialDrive",
  "Differential Drivebase": "DifferentialDrive",
  "SwerveDrive": "SwerveDrive",
  "Gyro": "Gyro",
  "Field2d": "Field",
  "PIDController": "PIDController",
  "PID Controller": "PIDController",
  "ProfiledPIDController": "ProfiledPIDController",
  "FMSInfo": "FMSInfo",
  "PowerDistribution": "PowerDistribution",
  "PDP": "PowerDistribution",
  "Encoder": "Encoder",
  "Quadrature Encoder": "Encoder",
  "Motor Controller": "Motor Controller",
  "Nidec Brushless": "Motor Controller",
  "Relay": "Relay",
  "Ultrasonic": "Ultrasonic",
  "Accelerometer": "Accelerometer",
  "3AxisAccelerometer": "3-Axis Accelerometer",
  "RobotPreferences": "RobotPreferences",
  "Scheduler": "Scheduler",
  "Subsystem": "Subsystem",
  "Command": "Command",
};

/** Suggest a widget type for a given NT4 data type string */
export function suggestWidgetType(
  ntDataType: string,
  isTunable: boolean,
): string {
  if (ntDataType === "boolean") {
    return isTunable ? "Toggle Switch" : "Boolean Box";
  }
  if (["int", "float", "double", "int32", "float32", "float64"].includes(ntDataType)) {
    return isTunable ? "Number Slider" : "Number Bar";
  }
  if (ntDataType === "string") {
    return isTunable ? "Text Display" : "Large Text Display";
  }
  // Arrays and other types
  return "Text Display";
}
