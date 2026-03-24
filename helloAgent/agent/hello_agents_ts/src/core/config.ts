/**
 * 配置类
 */
export class Config {
  // 历史管理配置
  min_retain_rounds: number = 3;
  compression_threshold: number = 0.8;
  enable_smart_compression: boolean = false;
  
  // 上下文窗口配置
  context_window: number = 4096;
  
  // 工具输出配置
  tool_output_max_lines: number = 100;
  tool_output_max_bytes: number = 10240;
  tool_output_truncate_direction: string = 'end';
  tool_output_dir: string = './tool_outputs';
  
  // 可观测性配置
  trace_enabled: boolean = true;
  trace_dir: string = './traces';
  trace_sanitize: boolean = true;
  trace_html_include_raw_response: boolean = false;
  
  // 会话持久化配置
  session_enabled: boolean = true;
  session_dir: string = './sessions';
  auto_save_enabled: boolean = true;
  auto_save_interval: number = 5;
  
  // Skills 配置
  skills_enabled: boolean = true;
  skills_dir: string = './skills';
  skills_auto_register: boolean = true;
  
  // 子代理配置
  subagent_enabled: boolean = true;
  subagent_use_light_llm: boolean = true;
  subagent_light_llm_provider: string = 'openai';
  subagent_light_llm_model: string = 'gpt-3.5-turbo';
  
  // TodoWrite 配置
  todowrite_enabled: boolean = true;
  todowrite_persistence_dir: string = './todowrite';
  
  // DevLog 配置
  devlog_enabled: boolean = true;
  devlog_persistence_dir: string = './devlogs';
  
  // 摘要配置
  summary_llm_provider: string = 'openai';
  summary_llm_model: string = 'gpt-3.5-turbo';
  summary_temperature: number = 0.3;
  summary_max_tokens: number = 200;
  
  // 钩子配置
  hook_timeout_seconds: number = 5.0;
  
  // 调试配置
  debug: boolean = false;

  dict(): any {
    return {
      min_retain_rounds: this.min_retain_rounds,
      compression_threshold: this.compression_threshold,
      enable_smart_compression: this.enable_smart_compression,
      context_window: this.context_window,
      tool_output_max_lines: this.tool_output_max_lines,
      tool_output_max_bytes: this.tool_output_max_bytes,
      tool_output_truncate_direction: this.tool_output_truncate_direction,
      tool_output_dir: this.tool_output_dir,
      trace_enabled: this.trace_enabled,
      trace_dir: this.trace_dir,
      trace_sanitize: this.trace_sanitize,
      trace_html_include_raw_response: this.trace_html_include_raw_response,
      session_enabled: this.session_enabled,
      session_dir: this.session_dir,
      auto_save_enabled: this.auto_save_enabled,
      auto_save_interval: this.auto_save_interval,
      skills_enabled: this.skills_enabled,
      skills_dir: this.skills_dir,
      skills_auto_register: this.skills_auto_register,
      subagent_enabled: this.subagent_enabled,
      subagent_use_light_llm: this.subagent_use_light_llm,
      subagent_light_llm_provider: this.subagent_light_llm_provider,
      subagent_light_llm_model: this.subagent_light_llm_model,
      todowrite_enabled: this.todowrite_enabled,
      todowrite_persistence_dir: this.todowrite_persistence_dir,
      devlog_enabled: this.devlog_enabled,
      devlog_persistence_dir: this.devlog_persistence_dir,
      summary_llm_provider: this.summary_llm_provider,
      summary_llm_model: this.summary_llm_model,
      summary_temperature: this.summary_temperature,
      summary_max_tokens: this.summary_max_tokens,
      hook_timeout_seconds: this.hook_timeout_seconds,
      debug: this.debug
    };
  }
}
