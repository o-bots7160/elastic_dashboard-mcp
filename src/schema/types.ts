// Elastic Dashboard layout JSON schema types

export interface ElasticLayout {
  version: number;
  grid_size: number;
  tabs: Tab[];
}

export interface Tab {
  name: string;
  grid_layout: GridLayout;
}

export interface GridLayout {
  layouts: LayoutWidget[];
  containers: WidgetContainer[];
}

export interface WidgetContainer {
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  properties: WidgetProperties;
}

export interface LayoutWidget extends WidgetContainer {
  children: WidgetContainer[];
}

export interface WidgetProperties {
  topic: string;
  period: number;
  [key: string]: unknown;
}

export function createEmptyLayout(gridSize = 128): ElasticLayout {
  return {
    version: 1.0,
    grid_size: gridSize,
    tabs: [],
  };
}

export function createTab(name: string): Tab {
  return {
    name,
    grid_layout: { layouts: [], containers: [] },
  };
}

export function createWidget(
  type: string,
  title: string,
  topic: string,
  x: number,
  y: number,
  width: number,
  height: number,
  extraProperties: Record<string, unknown> = {},
): WidgetContainer {
  return {
    title,
    x,
    y,
    width,
    height,
    type,
    properties: {
      topic,
      period: type === "Graph" ? 0.033 : 0.06,
      ...extraProperties,
    },
  };
}

export function createListLayout(
  title: string,
  x: number,
  y: number,
  width: number,
  height: number,
  children: WidgetContainer[] = [],
  labelPosition: string = "TOP",
): LayoutWidget {
  return {
    title,
    x,
    y,
    width,
    height,
    type: "List Layout",
    properties: {
      topic: "",
      period: 0.06,
      label_position: labelPosition,
    },
    children,
  };
}
