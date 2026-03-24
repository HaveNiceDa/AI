import { HelloAgentsLLM } from '../core/llm.js';
import { Config } from '../core/config.js';
import { SimpleAgent } from './simple_agent.js';
import { ReActAgent } from './react_agent.js';
import { PlanSolveAgent } from './plan_solve_agent.js';
import { ReflectionAgent } from './reflection_agent.js';

/**
 * 代理工厂函数
 */
export function createAgent(
  agent_type: string,
  name: string,
  llm: HelloAgentsLLM,
  system_prompt?: string,
  config?: Config,
  tool_registry?: any,
  max_steps: number = 5
) {
  switch (agent_type.toLowerCase()) {
    case 'simple':
      return new SimpleAgent(name, llm, system_prompt, config, tool_registry, max_steps);
    case 'react':
      return new ReActAgent(name, llm, system_prompt, config, tool_registry, max_steps);
    case 'plan_solve':
    case 'plan&solve':
      return new PlanSolveAgent(name, llm, system_prompt, config, tool_registry, max_steps);
    case 'reflection':
      return new ReflectionAgent(name, llm, system_prompt, config, tool_registry, max_steps);
    default:
      throw new Error(`Unknown agent type: ${agent_type}`);
  }
}

/**
 * 默认子代理工厂
 */
export function default_subagent_factory(
  agent_type: string,
  llm: HelloAgentsLLM,
  tool_registry?: any,
  config?: Config
) {
  return createAgent(
    agent_type,
    `subagent_${agent_type}`,
    llm,
    undefined,
    config,
    tool_registry
  );
}
