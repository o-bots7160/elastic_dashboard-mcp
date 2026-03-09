import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { readLayout, writeLayout, ensureLayout } from "../src/tools/layout.js";
import { createEmptyLayout, createTab, createWidget } from "../src/schema/types.js";
import { ConfigManager } from "../src/config/manager.js";

describe("Layout file I/O", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "elastic-mcp-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes and reads a layout file", () => {
    const filePath = path.join(tmpDir, "test.json");
    const layout = createEmptyLayout(128);
    layout.tabs.push(createTab("Teleop"));
    layout.tabs[0].grid_layout.containers.push(
      createWidget("Boolean Box", "Test Bool", "/SmartDashboard/TestBool", 0, 0, 128, 128),
    );

    writeLayout(filePath, layout);
    expect(fs.existsSync(filePath)).toBe(true);

    const loaded = readLayout(filePath);
    expect(loaded.version).toBe(1.0);
    expect(loaded.grid_size).toBe(128);
    expect(loaded.tabs).toHaveLength(1);
    expect(loaded.tabs[0].name).toBe("Teleop");
    expect(loaded.tabs[0].grid_layout.containers).toHaveLength(1);
    expect(loaded.tabs[0].grid_layout.containers[0].type).toBe("Boolean Box");
  });

  it("ensureLayout creates file if it doesn't exist", () => {
    const filePath = path.join(tmpDir, "new.json");
    const layout = ensureLayout(filePath);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(layout.tabs).toEqual([]);
  });

  it("ensureLayout reads existing file", () => {
    const filePath = path.join(tmpDir, "existing.json");
    const original = createEmptyLayout(128);
    original.tabs.push(createTab("Auto"));
    writeLayout(filePath, original);

    const loaded = ensureLayout(filePath);
    expect(loaded.tabs).toHaveLength(1);
    expect(loaded.tabs[0].name).toBe("Auto");
  });

  it("preserves Dart-compatible float formatting in JSON output", () => {
    const filePath = path.join(tmpDir, "floats.json");
    const layout = createEmptyLayout(128);
    layout.tabs.push(createTab("Test"));
    layout.tabs[0].grid_layout.containers.push(
      createWidget("Number Bar", "Speed", "/SmartDashboard/Speed", 0, 0, 256, 128, {
        min_value: -1,
        max_value: 1,
        divisions: 5,
      }),
    );

    writeLayout(filePath, layout);
    const raw = fs.readFileSync(filePath, "utf-8");

    // Structure fields should have .0
    expect(raw).toContain('"grid_size": 128.0');
    expect(raw).toContain('"x": 0.0');
    expect(raw).toContain('"y": 0.0');
    expect(raw).toContain('"width": 256.0');
    expect(raw).toContain('"height": 128.0');

    // "number" type properties should have .0
    expect(raw).toContain('"min_value": -1.0');
    expect(raw).toContain('"max_value": 1.0');
    expect(raw).toContain('"period": 0.06');

    // "integer" type properties must NOT have .0
    expect(raw).toContain('"divisions": 5');
    expect(raw).not.toContain('"divisions": 5.0');

    // version should stay as int
    expect(raw).toMatch(/"version":\s*1[,\s]/);
    expect(raw).not.toContain('"version": 1.0');
  });

  it("preserves color values as integers", () => {
    const filePath = path.join(tmpDir, "colors.json");
    const layout = createEmptyLayout(128);
    layout.tabs.push(createTab("Test"));
    layout.tabs[0].grid_layout.containers.push(
      createWidget("Boolean Box", "Flag", "/flag", 0, 0, 128, 128, {
        true_color: 4283215696,
        false_color: 4294198070,
      }),
    );

    writeLayout(filePath, layout);
    const raw = fs.readFileSync(filePath, "utf-8");

    // Color values should NOT get .0 appended
    expect(raw).toContain('"true_color": 4283215696');
    expect(raw).not.toContain('"true_color": 4283215696.0');
  });
});

describe("ConfigManager", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "elastic-mcp-config-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns defaults when no config file exists", () => {
    const mgr = new ConfigManager(tmpDir);
    const cfg = mgr.get();
    expect(cfg.defaults.show_submit_button).toBe(false);
    expect(cfg.defaults.period).toBe(0.06);
    expect(cfg.network_tables.enabled).toBe(false);
  });

  it("saves and loads config", () => {
    const mgr = new ConfigManager(tmpDir);
    mgr.update({
      tunable_topic_patterns: ["/Tuning/**"],
      defaults: { show_submit_button: true, period: 0.06, graph_period: 0.033 },
    });

    const mgr2 = new ConfigManager(tmpDir);
    expect(mgr2.get().tunable_topic_patterns).toEqual(["/Tuning/**"]);
    expect(mgr2.get().defaults.show_submit_button).toBe(true);
  });

  it("matches tunable topics", () => {
    const mgr = new ConfigManager(tmpDir);
    mgr.update({ tunable_topic_patterns: ["/Tuning/**", "/SmartDashboard/Tunables/*"] });

    expect(mgr.isTunableTopic("/Tuning/Drive/kP")).toBe(true);
    expect(mgr.isTunableTopic("/Tuning/Arm/kD")).toBe(true);
    expect(mgr.isTunableTopic("/SmartDashboard/Tunables/Speed")).toBe(true);
    expect(mgr.isTunableTopic("/SmartDashboard/Drive Speed")).toBe(false);
  });

  it("matches ignored topics", () => {
    const mgr = new ConfigManager(tmpDir);
    mgr.update({ ignored_topic_patterns: ["/SmartDashboard/.type", "/.metadata/**"] });

    expect(mgr.isIgnoredTopic("/SmartDashboard/.type")).toBe(true);
    expect(mgr.isIgnoredTopic("/.metadata/foo/bar")).toBe(true);
    expect(mgr.isIgnoredTopic("/SmartDashboard/Speed")).toBe(false);
  });

  it("resolves NT addresses", () => {
    const mgr = new ConfigManager(tmpDir);

    mgr.update({ network_tables: { enabled: true, connection_mode: "team_number", team_number: 353, ip_address: "" } });
    expect(mgr.getNtAddress()).toBe("10.3.53.2");

    mgr.update({ network_tables: { enabled: true, connection_mode: "team_number", team_number: 9999, ip_address: "" } });
    expect(mgr.getNtAddress()).toBe("10.99.99.2");

    mgr.update({ network_tables: { enabled: true, connection_mode: "localhost", team_number: 9999, ip_address: "" } });
    expect(mgr.getNtAddress()).toBe("127.0.0.1");

    mgr.update({ network_tables: { enabled: true, connection_mode: "roborio_mdns", team_number: 353, ip_address: "" } });
    expect(mgr.getNtAddress()).toBe("roboRIO-353-FRC.local");

    mgr.update({ network_tables: { enabled: true, connection_mode: "custom", team_number: 353, ip_address: "192.168.1.100" } });
    expect(mgr.getNtAddress()).toBe("192.168.1.100");
  });
});
