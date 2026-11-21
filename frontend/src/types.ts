export interface FindingItem {
  id?: number;
  host: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  evidence?: string;
  source_tool?: string;
  updated_at?: string;
}

export interface CredentialItem {
  id?: number;
  host: string;
  username?: string;
  secret: string;
  secret_type: string;
  service?: string;
  updated_at?: string;
}

export interface HostItem {
  host: string;
  hostname?: string;
  os_guess?: string;
  last_seen?: string;
  session_id?: string;
}

export interface PortItem {
  host: string;
  port: number;
  proto: string;
  state: string;
  service?: string;
  version?: string;
  updated_at?: string;
}

export interface EndpointItem {
  host: string;
  url: string;
  status_code?: number;
  source_tool?: string;
  updated_at?: string;
}

export interface MemorySummaryData {
  stats: {
    hosts: number;
    ports: number;
    endpoints: number;
    credentials: number;
    findings: number;
  };
  hosts: HostItem[];
  ports: PortItem[];
  endpoints: EndpointItem[];
  credentials: CredentialItem[];
  findings: FindingItem[];
}

export interface TerminalEvent {
  seq: number;
  timestamp: number;
  kind: "command" | "output";
  source: "agent" | "manual";
  task_id: string;
  text: string;
}

export interface RunnerEndpoint {
  ip: string;
  label: string;
  kind?: string;
}

export interface RunnerStatus {
  active: boolean;
  count: number;
  token: string;
  preferred_ip: string;
  port?: number;
  controller_ips?: string[];
  controller_endpoints?: RunnerEndpoint[];
  runners: Array<{
    runner_id: string;
    hostname: string;
    os: string;
    ip: string;
    tools: string[];
    transport: string;
    uptime_seconds: number;
    last_seen_seconds: number;
  }>;
}

export interface MockLabStatus {
  running: boolean;
  port: number;
  url: string;
  challenges_total: number;
  challenges_solved: number;
  challenges: Array<{
    id: string;
    name: string;
    solved: boolean;
    points: number;
  }>;
}

export interface AgentItem {
  name: string;
  key: string;
  description?: string;
  type?: string;
  pattern_type?: string | null;
  tools?: Array<{ name: string; description?: string }>;
}

export interface ModelItem {
  name: string;
  provider?: string | null;
  category?: string | null;
  description?: string | null;
}

export interface ModelSplitConfig {
  lead: string;
  fast: string;
  reason: string;
  split_active: boolean;
}

export interface ScopeConfig {
  enabled: boolean;
  scope: string[];
}

export interface AgentStep {
  id: string;
  time: string;
  type: "call" | "output" | "message" | "autonomy_checkpoint" | "final" | "error";
  agent?: string;
  tool?: string;
  command?: string;
  args?: any;
  output?: string;
  text?: string;
  phase?: string;
  phase_label?: string;
  cycle?: number;
  max_cycles?: number;
  turns_used?: number;
  max_turns?: number;
  reason?: string;
  final_message?: string;
  final_output?: any;
}

export interface AuditSessionItem {
  session_id: string;
  created_at: string;
  updated_at?: string;
  agent: string;
  model: string;
  target: string;
  event_count: number;
  tool_executions: number;
  status: string;
  has_report: boolean;
}
