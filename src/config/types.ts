export interface ElasticMcpConfig {
  tunable_topic_patterns: string[];
  ignored_topic_patterns: string[];
  defaults: {
    show_submit_button: boolean;
    period: number;
    graph_period: number;
  };
  network_tables: {
    enabled: boolean;
    connection_mode: "team_number" | "roborio_mdns" | "localhost" | "custom";
    team_number: number;
    ip_address: string;
  };
}

export const DEFAULT_CONFIG: ElasticMcpConfig = {
  tunable_topic_patterns: [],
  ignored_topic_patterns: [],
  defaults: {
    show_submit_button: false,
    period: 0.06,
    graph_period: 0.033,
  },
  network_tables: {
    enabled: false,
    connection_mode: "localhost",
    team_number: 9999,
    ip_address: "127.0.0.1",
  },
};
