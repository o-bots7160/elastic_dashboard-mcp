import { describe, it, expect } from "vitest";
import { snapToGrid, findNextAvailablePosition } from "../src/utils/grid.js";
import { hexToArgbInt, argbIntToHex } from "../src/utils/color.js";

describe("Grid utilities", () => {
  it("snaps values to grid", () => {
    expect(snapToGrid(0, 128)).toBe(0);
    expect(snapToGrid(100, 128)).toBe(128);
    expect(snapToGrid(200, 128)).toBe(256);
    expect(snapToGrid(64, 128)).toBe(128);
    expect(snapToGrid(63, 128)).toBe(0);
  });

  it("finds next available position with no obstacles", () => {
    const pos = findNextAvailablePosition([], 128, 128, 128);
    expect(pos).toEqual({ x: 0, y: 0 });
  });

  it("finds next available position avoiding occupied rects", () => {
    const occupied = [{ x: 0, y: 0, width: 128, height: 128 }];
    const pos = findNextAvailablePosition(occupied, 128, 128, 128);
    expect(pos).toEqual({ x: 128, y: 0 });
  });

  it("wraps to next row when full", () => {
    const occupied = Array.from({ length: 10 }, (_, i) => ({
      x: i * 128,
      y: 0,
      width: 128,
      height: 128,
    }));
    const pos = findNextAvailablePosition(occupied, 128, 128, 128, 10);
    expect(pos).toEqual({ x: 0, y: 128 });
  });

  it("handles large widgets", () => {
    const occupied = [{ x: 0, y: 0, width: 128, height: 128 }];
    const pos = findNextAvailablePosition(occupied, 256, 256, 128, 10);
    expect(pos).toEqual({ x: 128, y: 0 });
  });
});

describe("Color utilities", () => {
  it("converts hex RGB to ARGB int", () => {
    expect(hexToArgbInt("#4CAF50")).toBe(0xff4caf50 >>> 0);
    expect(hexToArgbInt("#F44336")).toBe(0xfff44336 >>> 0);
  });

  it("converts hex ARGB to ARGB int", () => {
    expect(hexToArgbInt("#FF4CAF50")).toBe(0xff4caf50 >>> 0);
  });

  it("converts ARGB int to hex string", () => {
    expect(argbIntToHex(4283215696)).toBe("#FF4CAF50");
    expect(argbIntToHex(4294967295)).toBe("#FFFFFFFF");
  });

  it("round-trips hex correctly", () => {
    const hex = "#FF2196F3";
    expect(argbIntToHex(hexToArgbInt(hex))).toBe(hex);
  });
});
