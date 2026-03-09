import * as fs from "node:fs";
import * as path from "node:path";
import type { ElasticMcpConfig } from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";

const CONFIG_FILENAME = ".elastic-mcp-config.json";

export class ConfigManager {
  private config: ElasticMcpConfig;
  private configPath: string;

  constructor(workingDir?: string) {
    this.configPath = path.join(workingDir ?? process.cwd(), CONFIG_FILENAME);
    this.config = this.load();
  }

  private load(): ElasticMcpConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, "utf-8");
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_CONFIG, ...parsed, defaults: { ...DEFAULT_CONFIG.defaults, ...parsed.defaults }, network_tables: { ...DEFAULT_CONFIG.network_tables, ...parsed.network_tables } };
      }
    } catch {
      // Fall through to default
    }
    return { ...DEFAULT_CONFIG };
  }

  save(): void {
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2) + "\n");
  }

  get(): ElasticMcpConfig {
    return this.config;
  }

  update(partial: Partial<ElasticMcpConfig>): ElasticMcpConfig {
    if (partial.defaults) {
      this.config.defaults = { ...this.config.defaults, ...partial.defaults };
    }
    if (partial.network_tables) {
      this.config.network_tables = { ...this.config.network_tables, ...partial.network_tables };
    }
    if (partial.tunable_topic_patterns !== undefined) {
      this.config.tunable_topic_patterns = partial.tunable_topic_patterns;
    }
    if (partial.ignored_topic_patterns !== undefined) {
      this.config.ignored_topic_patterns = partial.ignored_topic_patterns;
    }
    this.save();
    return this.config;
  }

  /** Check if a topic matches any of the tunable patterns */
  isTunableTopic(topic: string): boolean {
    return this.config.tunable_topic_patterns.some((pattern) =>
      matchGlob(pattern, topic),
    );
  }

  /** Check if a topic should be ignored */
  isIgnoredTopic(topic: string): boolean {
    return this.config.ignored_topic_patterns.some((pattern) =>
      matchGlob(pattern, topic),
    );
  }

  /** Resolve NT4 server address from config */
  getNtAddress(): string {
    const nt = this.config.network_tables;
    switch (nt.connection_mode) {
      case "team_number":
        return teamNumberToIp(nt.team_number);
      case "roborio_mdns":
        return `roboRIO-${nt.team_number}-FRC.local`;
      case "localhost":
        return "127.0.0.1";
      case "custom":
        return nt.ip_address;
    }
  }
}

function teamNumberToIp(teamNumber: number): string {
  const te = Math.floor(teamNumber / 100).toString();
  const am = (teamNumber % 100).toString().padStart(2, "0");
  return `10.${te}.${am}.2`;
}

function matchGlob(pattern: string, value: string): boolean {
  // Simple glob matching: ** matches any path, * matches within a segment
  const regex = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\{\{GLOBSTAR\}\}/g, ".*");
  return new RegExp(`^${regex}$`).test(value);
}
