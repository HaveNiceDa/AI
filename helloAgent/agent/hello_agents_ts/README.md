# Hello Agents TypeScript

TypeScript 版本的 Hello Agents 项目，实现了多种智能代理类型。

## 项目结构

```
hello_agents_ts/
├── src/
│   ├── core/           # 核心模块
│   │   ├── agent.ts     # 代理基类
│   │   ├── config.ts    # 配置类
│   │   ├── llm.ts       # LLM 客户端
│   │   ├── message.ts   # 消息类
│   │   └── lifecycle.ts # 生命周期管理
│   ├── agents/          # 代理实现
│   │   ├── simple_agent.ts      # 简单代理
│   │   ├── react_agent.ts        # ReAct 代理
│   │   ├── plan_solve_agent.ts   # Plan & Solve 代理
│   │   ├── reflection_agent.ts   # Reflection 代理
│   │   └── factory.ts           # 代理工厂
│   ├── tools/           # 工具模块（待实现）
│   ├── context/         # 上下文管理（待实现）
│   ├── observability/   # 可观测性（待实现）
│   ├── skills/          # 技能模块（待实现）
│   └── index.ts         # 主入口
├── package.json         # 项目配置
└── tsconfig.json        # TypeScript 配置
```

## 安装依赖

```bash
cd hello_agents_ts
npm install
```

## 环境变量

需要配置以下环境变量（在 .env 文件中）：

```
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=your_openai_base_url
MODEL_NAME=your_model_name
```

## 使用示例

### 创建简单代理

```typescript
import { HelloAgentsLLM, createAgent } from './src';

// 初始化 LLM 客户端
const llm = new HelloAgentsLLM('openai', 'gpt-3.5-turbo');

// 创建 Simple 代理
const simpleAgent = createAgent('simple', 'simple_agent', llm);

// 运行代理
const result = await simpleAgent.arun('你好，帮我写一首诗');
console.log(result);
```

### 创建 ReAct 代理

```typescript
const reactAgent = createAgent('react', 'react_agent', llm);
const result = await reactAgent.run('今天北京的天气怎么样？');
console.log(result);
```

### 创建 Plan & Solve 代理

```typescript
const planSolveAgent = createAgent('plan_solve', 'plan_solve_agent', llm);
const result = await planSolveAgent.run('一个水果店周一卖出了15个苹果。周二卖出的苹果数量是周一的两倍。周三卖出的数量比周二少了5个。请问这三天总共卖出了多少个苹果？');
console.log(result);
```

### 创建 Reflection 代理

```typescript
const reflectionAgent = createAgent('reflection', 'reflection_agent', llm);
const result = await reflectionAgent.run('编写一个TypeScript函数，找出1到n之间所有的素数 (prime numbers)。');
console.log(result);
```

## 构建项目

```bash
npm run build
```

## 运行开发模式

```bash
npm run dev
```

## 运行测试

```bash
npm run test
```

## 代码风格检查

```bash
npm run lint
```
