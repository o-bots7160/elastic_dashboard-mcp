import { describe, it, expect } from "vitest";
import {
  getWidgetTypeInfo,
  isValidWidgetType,
  resolveWidgetType,
  getDefaultSize,
  getMinSize,
  suggestWidgetType,
  getAllWidgetTypes,
} from "../src/schema/widgets.js";

describe("Widget Registry", () => {
  it("recognizes all primary widget type names", () => {
    const expectedTypes = [
      "Text Display", "Large Text Display", "Number Slider", "Number Bar",
      "Voltage View", "Radial Gauge", "Graph", "Match Time", "Boolean Box",
      "Toggle Button", "Toggle Switch", "Single Color View", "Multi Color View",
      "Accelerometer", "3-Axis Accelerometer", "Camera Stream", "ComboBox Chooser",
      "Split Button Chooser", "Scheduler", "Command", "Subsystem", "DifferentialDrive",
      "SwerveDrive", "YAGSL Swerve Drive", "Encoder", "Field", "FMSInfo", "Gyro",
      "Motor Controller", "Alerts", "PIDController", "ProfiledPIDController",
      "PowerDistribution", "Relay", "RobotPreferences", "Ultrasonic", "List Layout",
    ];

    for (const type of expectedTypes) {
      expect(isValidWidgetType(type), `${type} should be valid`).toBe(true);
    }
  });

  it("resolves aliases to primary type names", () => {
    expect(resolveWidgetType("Text View")).toBe("Text Display");
    expect(resolveWidgetType("Simple Dial")).toBe("Radial Gauge");
    expect(resolveWidgetType("String Chooser")).toBe("ComboBox Chooser");
    expect(resolveWidgetType("Differential Drivebase")).toBe("DifferentialDrive");
    expect(resolveWidgetType("Field2d")).toBe("Field");
    expect(resolveWidgetType("PDP")).toBe("PowerDistribution");
    expect(resolveWidgetType("Quadrature Encoder")).toBe("Encoder");
    expect(resolveWidgetType("Nidec Brushless")).toBe("Motor Controller");
    expect(resolveWidgetType("PID Controller")).toBe("PIDController");
    expect(resolveWidgetType("3AxisAccelerometer")).toBe("3-Axis Accelerometer");
  });

  it("returns correct default sizes", () => {
    expect(getDefaultSize("Boolean Box", 128)).toEqual({ width: 128, height: 128 });
    expect(getDefaultSize("SwerveDrive", 128)).toEqual({ width: 256, height: 256 });
    expect(getDefaultSize("PowerDistribution", 128)).toEqual({ width: 384, height: 512 });
    expect(getDefaultSize("FMSInfo", 128)).toEqual({ width: 384, height: 128 });
  });

  it("returns correct minimum sizes", () => {
    expect(getMinSize("Graph", 128)).toEqual({ width: 256, height: 256 });
    expect(getMinSize("PIDController", 128)).toEqual({ width: 256, height: 384 });
    expect(getMinSize("List Layout", 128)).toEqual({ width: 256, height: 256 });
  });

  it("suggests correct widget types based on NT data type", () => {
    expect(suggestWidgetType("boolean", false)).toBe("Boolean Box");
    expect(suggestWidgetType("boolean", true)).toBe("Toggle Switch");
    expect(suggestWidgetType("double", false)).toBe("Number Bar");
    expect(suggestWidgetType("double", true)).toBe("Number Slider");
    expect(suggestWidgetType("string", false)).toBe("Large Text Display");
    expect(suggestWidgetType("string", true)).toBe("Text Display");
  });

  it("returns all widget type info", () => {
    const all = getAllWidgetTypes();
    expect(all.length).toBeGreaterThan(30);
    expect(all.every((t) => t.type && t.category)).toBe(true);
  });

  it("returns undefined for unknown types", () => {
    expect(getWidgetTypeInfo("NotARealWidget")).toBeUndefined();
    expect(isValidWidgetType("FakeWidget")).toBe(false);
  });
});
