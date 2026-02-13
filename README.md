# LangChain TypeScript 项目

这是一个使用 TypeScript 和 LangChain 构建的项目，包含了多个示例和工具。

## 项目结构

```
├── chain.ts           # 链式调用示例
├── embedding.ts       # 嵌入向量示例
├── textsplitter.ts    # 文本分割工具
├── csvloader.ts       # CSV 文件加载器
├── pdf-example.ts     # PDF 文本提取示例
├── pdf-lib-example.ts # PDF 创建和修改示例
├── test.ts            # 测试文件
├── tsconfig.json      # TypeScript 配置
└── package.json       # 项目依赖配置
```

## 安装依赖

```bash
pnpm install
```

## 可用脚本

- `pnpm run dev` - 运行开发模式
- `pnpm run build` - 编译 TypeScript 代码
- `pnpm run test` - 运行测试
- `pnpm run textsplitter` - 运行文本分割示例
- `pnpm run chain` - 运行链式调用示例
- `pnpm run embedding` - 运行嵌入向量示例
- `pnpm run csvloader` - 运行 CSV 加载器示例
- `pnpm run pdf` - 运行 PDF 文本提取示例
- `pnpm run pdf-lib` - 运行 PDF 创建和修改示例

## TypeScript 配置

项目使用严格的 TypeScript 配置，包括：

- 启用严格模式 (`strict: true`)
- 检查未使用的变量和参数
- 检查隐式返回
- 模块解析使用 bundler 模式
- 支持 ES2022 特性

## 环境变量

确保在项目根目录创建 `.env` 文件并配置必要的 API 密钥：

```env
API_KEY=your_api_key_here
```

## 运行示例

### 文本分割
```bash
pnpm run textsplitter
```

### 链式调用
```bash
pnpm run chain
```

### 嵌入向量
```bash
pnpm run embedding
```

### PDF 处理

#### 提取 PDF 文本（类似 Python pypdf）
```bash
pnpm run pdf
```

需要将 PDF 文件放在项目根目录下的 `example.pdf`，或修改代码中的路径。

#### 创建和修改 PDF
```bash
pnpm run pdf-lib
```

这会创建三个 PDF 文件：
- `created.pdf` - 新创建的 PDF
- `modified.pdf` - 修改后的 PDF
- `merged.pdf` - 合并后的 PDF

## PDF 处理库说明

项目包含三个主要的 PDF 处理库：

### 1. pdf-parse
- **用途**: 提取 PDF 文本内容
- **特点**: 简单易用，类似 Python 的 pypdf
- **适用场景**: 只需要读取 PDF 文本

### 2. pdfjs-dist
- **用途**: Mozilla 的 PDF.js 库
- **特点**: 功能强大，支持渲染和提取
- **适用场景**: 需要在浏览器中渲染 PDF 或提取详细内容

### 3. pdf-lib
- **用途**: 创建、修改和生成 PDF
- **特点**: 现代化 API，支持完整的 PDF 操作
- **适用场景**: 需要创建、修改、合并 PDF 文件

## 技术栈

- **TypeScript** - 类型安全的 JavaScript 超集
- **LangChain** - 语言模型应用开发框架
- **tsx** - TypeScript 执行器
- **pnpm** - 快速、节省磁盘空间的包管理器
- **pdf-parse** - PDF 文本提取
- **pdf-lib** - PDF 创建和修改
- **pdfjs-dist** - PDF 渲染和处理

## 开发

在开发过程中，你可以直接使用 `tsx` 运行 TypeScript 文件：

```bash
npx tsx your-file.ts
```

或者使用配置好的脚本：

```bash
pnpm run dev your-file.ts
```

## 类型检查

运行 TypeScript 类型检查：

```bash
npx tsc --noEmit
```

## 构建

编译 TypeScript 代码：

```bash
pnpm run build
```

编译后的文件将输出到 `dist` 目录。