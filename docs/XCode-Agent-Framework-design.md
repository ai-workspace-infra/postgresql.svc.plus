Agent Framework 设计文档

版本：v1.0
项目代号：Project Codexium
作者：svc.plus 架构组（Pan Haitao）
目标：统一代码智能、运维智能与模型桥接能力的开发者工作台

一、系统愿景

“让 AI 不只是写代码，而是理解系统。”

Codexium 的目标是构建一个统一的智能代理层，使得开发者在编程、测试、运维的整个生命周期中，都能通过 /api/agent/* 接口访问具备上下文记忆与验证能力的 LLM 工具链。

系统分为三大支柱：

模块	名称	职责
/api/agent/code	CodeSmith	编码智能：分析、重构、生成、解释代码
/api/agent/ops	OpsMind	运维智能：测试验证、性能剖析、异常诊断
/api/agent/bridge	LLM-Bridge	桥接智能：与国内外大模型生态互联
二、系统架构概览
flowchart TB
  subgraph UI["🖥️ Web IDE / Dashboard"]
    C1[任务列表] --> C2[任务详情与日志]
    C2 --> C3[运行面板（Playwright / DevTools / LLM）]
  end

  subgraph API["🧠 Agent Gateway (Node/Deno)"]
    A1[/api/agent/code/]:::code --> A3
    A2[/api/agent/ops/]:::ops --> A3
    A4[/api/agent/bridge/]:::bridge --> A3
    A3[(Runs Registry + Storage)]
  end

  subgraph Runtime["⚙️ Runners / Services"]
    R1[Codex-CLI / Claude-CLI / Gemini-CLI]
    R2[Playwright MCP Server]
    R3[DevTools MCP Server]
    R4[LLM-Bridge Adapter]
  end

  subgraph Infra["💾 Backend Infra"]
    D1[(PostgreSQL / SQLite)]
    D2[(S3 / Local Storage)]
  end

  UI --> API
  API --> Runtime
  API --> Infra
  Runtime --> D2
  classDef code fill=#C6E2FF,stroke=#4582EC;
  classDef ops fill=#FFF2CC,stroke=#D6B656;
  classDef bridge fill=#D9EAD3,stroke=#6AA84F;

三、API 模块划分与命名语义
模块路径	名称	职责描述	核心子接口
/api/agent/code	CodeSmith	面向代码智能任务	analyze, refactor, generate, explain, review
/api/agent/ops	OpsMind	面向运维与测试任务	playwright, devtools, profile, report
/api/agent/bridge	LLM-Bridge	模型桥接与分发层	invoke, list-models, proxy
四、功能说明
1. CodeSmith（编码智能）

目标： 让 LLM 理解项目上下文并参与重构。
功能示例：

功能	说明	CLI 或工具
analyze	分析文件结构与依赖	codex-cli analyze
refactor	自动重构、删除死代码	codex-cli refactor
generate	根据提示生成新代码	claude-cli generate
explain	对复杂逻辑生成自然语言解释	gemini-cli explain

运行模式：
通过 child_process.spawn 调用 CLI，并以 SSE 流式推送执行日志。
每次执行结果存储为 run 记录，并关联到任务。

2. OpsMind（运维智能）

目标： 自动化验证与性能剖析。

MCP 接口：

功能	MCP Server	说明
playwright	mcp-playwright	执行端到端测试、截图、trace
devtools	mcp-devtools	运行 CPU/Heap Profiler
profile	mcp-devtools	生成 trace.json 与指标摘要
report	内部	汇总生成性能分析报告（HTML/PDF）

示例工作流：

POST /api/agent/ops/playwright
→ 启动 Playwright MCP → trace.zip → 存储为附件 → 任务run状态更新

3. LLM-Bridge（模型桥接层）

目标： 在不暴露私钥的前提下，统一访问国内外大模型生态。

功能	说明	适配对象
invoke	通用调用接口（支持 OpenAI 格式）	ChatGPT / Claude / Qwen / Yi / Baichuan / Moonshot
list-models	返回所有可用模型及状态	从注册表动态读取
proxy	将 REST 调用转为相应 API 代理	可接入 WebSocket 流式返回

配置结构示例：

llm_bridge:
  providers:
    openai:
      endpoint: https://api.openai.com/v1
      api_key: $OPENAI_API_KEY
    qwen:
      endpoint: https://dashscope.aliyuncs.com/api/v1
      api_key: $DASHSCOPE_API_KEY
    moonshot:
      endpoint: https://api.moonshot.cn/v1
      api_key: $MOONSHOT_API_KEY


作用：

对上：所有 /api/agent/code、/api/agent/ops 请求可指定 provider 参数；

对下：桥接各类 LLM API，兼容 JSON Schema 响应；

提供统一上下文缓存机制（如 KV/Redis session）。

五、数据库模型
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT,
  summary TEXT,
  status TEXT CHECK (status IN ('todo','doing','done','archived')),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id),
  runner TEXT,
  input JSONB,
  output JSONB,
  status TEXT CHECK (status IN ('queued','running','passed','failed')),
  artifacts TEXT[],
  started_at TIMESTAMP,
  finished_at TIMESTAMP
);

CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id),
  name TEXT,
  kind TEXT,
  mime TEXT,
  url TEXT,
  size INT,
  created_at TIMESTAMP DEFAULT now()
);

六、前端设计（Web 工作台）

结构：

区域	功能	技术栈
左栏	任务列表（搜索、筛选、状态切换）	Zustand + SWR
右栏	任务详情、运行面板、上传区	Tailwind + shadcn/ui
底部	实时日志控制台	WebSocket/SSE
顶部	模型选择（LLM-Bridge 模式切换）	Select + Context Provider
七、安全与隔离设计

Runner 容器隔离：
所有 Playwright/DevTools Runner 运行于独立容器，带文件系统隔离。

命令白名单：
/api/agent/code 仅能执行 codex-cli 等注册命令。

模型访问控制：
LLM-Bridge 支持：

统一 API Key 管理；

访问审计；

模型路由黑白名单（例如禁止访问海外模型）。

上传验证：
图片/trace 文件 MIME 检查 + 大小上限（默认 50MB）。

八、部署与扩展

推荐部署模式：

服务	类型	部署建议
API Gateway	Node 18+	Docker 容器，内网访问 MCP
Playwright MCP	Sidecar	mcr.microsoft.com/playwright 镜像
DevTools MCP	Sidecar	chrome-launcher 环境
LLM-Bridge	统一服务	可独立部署，实现模型代理
Storage	S3 或 MinIO	附件与 trace 存储
DB	PostgreSQL	任务、运行、模型状态持久化
九、未来路线图（v1 → v3）
阶段	特性	说明
v1.0	CodeSmith + OpsMind 基础实现	完成 CLI/MCP 集成、运行记录体系
v1.1	LLM-Bridge 接入国内模型	Qwen、Yi、Baichuan、Moonshot
v2.0	会话上下文与任务记忆	Redis + Vector Store
v2.1	Web 工作流可视化（Flow View）	支持多步骤组合任务
v3.0	多代理协作模式	让 CodeSmith 与 OpsMind 自动协作验证
十、总结与命名哲学

CodeSmith → “写得比人快一点”

OpsMind → “想得比机器深一点”

LLM-Bridge → “连接的不是模型，而是生态”

三者共同组成一个统一的“Agent Infra”，能运行在开发机、CI/CD 管道、甚至本地容器中，为 Cloud-Neutral 工程体系提供智能层。
