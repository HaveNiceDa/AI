/**
 * 事件类型
 */
export enum EventType {
  AGENT_START = 'agent_start',
  AGENT_FINISH = 'agent_finish',
  AGENT_ERROR = 'agent_error',
  STEP_START = 'step_start',
  STEP_FINISH = 'step_finish',
  TOOL_CALL = 'tool_call',
  TOOL_RESPONSE = 'tool_response'
}

/**
 * 代理事件
 */
export class AgentEvent {
  type: EventType;
  agentName: string;
  timestamp: number;
  data: any;

  constructor(type: EventType, agentName: string, data: any = {}) {
    this.type = type;
    this.agentName = agentName;
    this.timestamp = Date.now();
    this.data = data;
  }

  static create(type: EventType, agentName: string, data: any = {}): AgentEvent {
    return new AgentEvent(type, agentName, data);
  }
}

/**
 * 生命周期钩子类型
 */
export type LifecycleHook = (event: AgentEvent) => Promise<void> | void;

/**
 * 执行上下文
 */
export class ExecutionContext {
  agentName: string;
  startTime: number;
  steps: number;
  tokens: number;
  metadata: any;

  constructor(agentName: string) {
    this.agentName = agentName;
    this.startTime = Date.now();
    this.steps = 0;
    this.tokens = 0;
    this.metadata = {};
  }

  get duration(): number {
    return Date.now() - this.startTime;
  }

  incrementSteps(): void {
    this.steps++;
  }

  addTokens(count: number): void {
    this.tokens += count;
  }

  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }
}
