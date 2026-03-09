# RAG TypeScript 项目

这是一个基于 TypeScript 的 RAG（检索增强生成）系统，从 Python 版本转换而来。

## 项目结构

```
rag-ts/
├── src/
│   ├── config.ts              # 配置文件
│   ├── vectorStore.ts         # 向量存储服务
│   ├── knowledgeBase.ts       # 知识库服务
│   ├── chatHistory.ts         # 聊天历史存储服务
│   ├── rag.ts                 # RAG 核心服务
│   └── server.ts              # Express 服务器
├── public/
│   ├── upload.html            # 文件上传页面
│   ├── upload.css
│   ├── upload.js
│   ├── qa.html                # 问答页面
│   ├── qa.css
│   └── qa.js
├── package.json
├── tsconfig.json
└── README.md
```

## 安装依赖

```bash
npm install
```

## 配置

确保你已经配置了阿里云 DashScope API 密钥。在运行之前，需要设置环境变量：

```bash
export DASHSCOPE_API_KEY="your-api-key"
```

## 运行项目

### 开发模式

```bash
npm run dev
```

### 构建并运行

```bash
npm run build
npm start
```

服务器将在 `http://localhost:3000` 启动。

## 使用说明

### 文件上传

访问 `http://localhost:3000/upload.html` 上传 TXT 文件到知识库。

### 智能问答

访问 `http://localhost:3000/qa.html` 进行智能问答。

## API 端点

- `POST /api/upload` - 上传文件到知识库
- `POST /api/chat` - 发送聊天消息（支持流式响应）

## 技术栈

- **后端**: Node.js + Express + TypeScript
- **向量数据库**: Chroma
- **AI 模型**: 阿里云 DashScope (通义千问)
- **前端**: HTML + CSS + JavaScript

## 注意事项

1. 确保已安装 Node.js (版本 18 或更高)
2. 需要有效的阿里云 DashScope API 密钥
3. 首次运行会自动创建必要的文件夹和数据库文件
