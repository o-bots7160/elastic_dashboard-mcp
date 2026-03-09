import { describe, it, expect } from "vitest";
import { validateLayout } from "../src/schema/validation.js";
import type { ElasticLayout } from "../src/schema/types.js";
import { createEmptyLayout, createTab, createWidget } from "../src/schema/types.js";

describe("Layout Validation", () => {
  it("passes for a valid empty layout", () => {
    const layout = createEmptyLayout(128);
    layout.tabs.push(createTab("Test"));
    const errors = validateLayout(layout);
    expect(errors).toEqual([]);
  });

  it("catches invalid version", () => {
    const layout = createEmptyLayout(128);
    layout.version = 2.0;
    const errors = validateLayout(layout);
    expect(errors.some((e) => e.path === "version")).toBe(true);
  });

  it("catches duplicate tab names", () => {
    const layout = createEmptyLayout(128);
    layout.tabs.push(createTab("Teleop"));
    layout.tabs.push(createTab("Teleop"));
    const errors = validateLayout(layout);
    expect(errors.some((e) => e.message.includes("Duplicate tab name"))).toBe(true);
  });

  it("catches unknown widget types", () => {
    const layout = createEmptyLayout(128);
    const tab = createTab("Test");
    tab.grid_layout.containers.push(createWidget("FakeWidget", "Test", "/test", 0, 0, 128, 128));
    layout.tabs.push(tab);
    const errors = validateLayout(layout);
    expect(errors.some((e) => e.message.includes("Unknown widget type"))).toBe(true);
  });

  it("catches widgets that are too small for their type", () => {
    const layout = createEmptyLayout(128);
    const tab = createTab("Test");
    // Graph requires min 2x2 (256x256)
    tab.grid_layout.containers.push(createWidget("Graph", "My Graph", "/test", 0, 0, 128, 128));
    layout.tabs.push(tab);
    const errors = validateLayout(layout);
    expect(errors.some((e) => e.message.includes("min width"))).toBe(true);
  });

  it("catches overlapping widgets", () => {
    const layout = createEmptyLayout(128);
    const tab = createTab("Test");
    tab.grid_layout.containers.push(createWidget("Boolean Box", "A", "/a", 0, 0, 256, 128));
    tab.grid_layout.containers.push(createWidget("Boolean Box", "B", "/b", 128, 0, 256, 128));
    layout.tabs.push(tab);
    const errors = validateLayout(layout);
    expect(errors.some((e) => e.message.includes("overlap"))).toBe(true);
  });

  it("catches missing topic", () => {
    const layout: ElasticLayout = {
      version: 1.0,
      grid_size: 128,
      tabs: [
        {
          name: "Test",
          grid_layout: {
            layouts: [],
            containers: [
              {
                title: "No Topic",
                x: 0,
                y: 0,
                width: 128,
                height: 128,
                type: "Boolean Box",
                properties: { topic: "", period: 0.06 },
              },
            ],
          },
        },
      ],
    };
    const errors = validateLayout(layout);
    expect(errors.some((e) => e.message.includes("topic is required"))).toBe(true);
  });

  it("passes for non-overlapping widgets", () => {
    const layout = createEmptyLayout(128);
    const tab = createTab("Test");
    tab.grid_layout.containers.push(createWidget("Boolean Box", "A", "/a", 0, 0, 128, 128));
    tab.grid_layout.containers.push(createWidget("Boolean Box", "B", "/b", 128, 0, 128, 128));
    tab.grid_layout.containers.push(createWidget("Boolean Box", "C", "/c", 0, 128, 128, 128));
    layout.tabs.push(tab);
    const errors = validateLayout(layout);
    expect(errors).toEqual([]);
  });
});
