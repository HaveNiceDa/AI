import { Message } from './message.js';
import { HelloAgentsLLM } from './llm.js';
import { Config } from './config.js';
import { AgentEvent, EventType, LifecycleHook, ExecutionContext } from './lifecycle.js';
import { HistoryManager } from '../context/history.js';

/**
 * Agent 基类
 */
export abstract class Agent {
  name: string;
  llm: HelloAgentsLLM;
  system_prompt: string | undefined;
  config: Config;
  tool_registry: any;
  history_manager: any;
  truncator: any;
  token_counter: any;
  trace_logger: any;
  skill_loader: any;
  session_store: any;
  _session_metadata: any;
  _start_time: Date;
  _history_token_count: number;

  constructor(
    name: string,
    llm: HelloAgentsLLM,
    system_prompt?: string,
    config?: Config,
    tool_registry?: any
  ) {
    this.name = name;
    this.llm = llm;
    this.system_prompt = system_prompt;
    this.config = config || new Config();
    this.tool_registry = tool_registry;

    // 初始化组件
    this._initComponents();

    // 会话元数据
    this._session_metadata = {
      created_at: new Date().toISOString(),
      total_tokens: 0,
      total_steps: 0,
      duration_seconds: 0
    };
    this._start_time = new Date();
    this._history_token_count = 0;
  }

  private _initComponents(): void {
    // 初始化历史管理器
    this.history_manager = new HistoryManager();
  }

  abstract run(input_text: string, ...args: any[]): string;

  async arun(
    input_text: string,
    on_start?: LifecycleHook,
    on_step?: LifecycleHook,
    on_finish?: LifecycleHook,
    on_error?: LifecycleHook,
    ...args: any[]
  ): Promise<string> {
    // 触发开始事件
    await this._emit_event(
      EventType.AGENT_START,
      on_start,
      { input_text }
    );

    try {
      // 默认实现：在主线程中运行同步 run()
      const result = this.run(input_text, ...args);

      // 触发完成事件
      await this._emit_event(
        EventType.AGENT_FINISH,
        on_finish,
        { result }
      );

      return result;
    } catch (error) {
      // 触发错误事件
      await this._emit_event(
        EventType.AGENT_ERROR,
        on_error,
        { error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  arun_stream(
    input_text: string,
    ...args: any[]
  ): AsyncGenerator<AgentEvent, void, unknown> {
    return this._runStream(input_text, ...args);
  }

  private async* _runStream(input_text: string, ...args: any[]): AsyncGenerator<AgentEvent, void, unknown> {
    // 开始事件
    yield AgentEvent.create(
      EventType.AGENT_START,
      this.name,
      { input_text }
    );

    // 执行
    try {
      const result = await this.arun(input_text, ...args);

      // 完成事件
      yield AgentEvent.create(
        EventType.AGENT_FINISH,
        this.name,
        { result }
      );
    } catch (error) {
      // 错误事件
      yield AgentEvent.create(
        EventType.AGENT_ERROR,
        this.name,
        { error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  async _emit_event(
    event_type: EventType,
    hook: LifecycleHook | undefined,
    data: any
  ): Promise<void> {
    const event = AgentEvent.create(event_type, this.name, data);

    if (hook) {
      try {
        const timeout = this.config.hook_timeout_seconds || 5.0;
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error('Hook timeout')), timeout * 1000);
        });
        await Promise.race([hook(event), timeoutPromise]);
      } catch (error) {
        // 钩子异常不应中断主流程
        console.warn('Hook error:', error);
      }
    }
  }

  add_message(message: Message): void {
    if (this.history_manager) {
      this.history_manager.addMessage(message);
    }
  }

  clear_history(): void {
    if (this.history_manager) {
      this.history_manager.clear();
    }
  }

  get_history(): Message[] {
    if (this.history_manager) {
      return this.history_manager.getMessages();
    }
    return [];
  }

  // 工具调用相关方法
  _build_tool_schemas(): any[] {
    if (!this.tool_registry) {
      return [];
    }

    const schemas: any[] = [];
    // 构建工具 schema
    const toolNames = this.tool_registry.listTools();
    for (const name of toolNames) {
      const tool = this.tool_registry.getTool(name);
      if (tool) {
        schemas.push({
          type: 'function',
          function: {
            name,
            description: tool.description,
            parameters: {
              type: 'object',
              properties: {
                input: {
                  type: 'string',
                  description: '工具的输入参数'
                }
              },
              required: ['input']
            }
          }
        });
      }
    }
    return schemas;
  }

  _execute_tool_call(tool_name: string, args: any): string {
    if (!this.tool_registry) {
      return '❌ 错误：未配置工具注册表';
    }

    try {
      const result = this.tool_registry.executeTool(tool_name, args);
      if (typeof result === 'string') {
        return result;
      } else {
        return '工具执行结果';
      }
    } catch (error) {
      return `❌ 错误：${error instanceof Error ? error.message : String(error)}`;
    }
  }

  // 会话持久化相关方法
  save_session(session_name: string): string {
    if (!this.session_store) {
      throw new Error('会话持久化未启用');
    }

    // 这里需要实现会话保存逻辑
    return '保存路径';
  }

  load_session(filepath: string, check_consistency: boolean = true): void {
    if (!this.session_store) {
      throw new Error('会话持久化未启用');
    }

    // 这里需要实现会话加载逻辑
  }

  list_sessions(): any[] {
    if (!this.session_store) {
      return [];
    }

    // 这里需要实现会话列表逻辑
    return [];
  }

  // 子代理相关方法
  run_as_subagent(
    task: string,
    tool_filter?: any,
    return_summary: boolean = true,
    max_steps_override?: number
  ): any {
    // 这里需要实现子代理运行逻辑
    return {
      success: true,
      summary: '子代理执行摘要',
      metadata: {}
    };
  }

  toString(): string {
    return `Agent(name=${this.name}, model=${this.llm.model})`;
  }

  toJSON(): any {
    return {
      name: this.name,
      model: this.llm.model,
      type: this.constructor.name
    };
  }
}
