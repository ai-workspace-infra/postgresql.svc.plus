# Cloud IaC Catalog

Cloud IaC Catalog 提供跨云厂商（AWS、GCP、Azure、阿里云）的核心基础设施服务对照表，并预置 Terraform、Pulumi 以及 GitHub CI 的触发入口。页面基于 Next.js App Router 与 Tailwind CSS 构建，可快速扩展为企业内部的多云自动化控制台。

## 开发调试

```bash
cd dashboard
yarn install
yarn dev
```

开发服务器默认运行在 <http://localhost:3000>。访问 `/cloud_iac` 路由即可查看 IAC 编排面板。

## 数据与配置

- `lib/iac/catalog.ts`：维护十三大类别的产品对照表与 IaC 模块元数据。
- `lib/iac/actions.ts`：封装触发 Terraform、Pulumi 与 GitHub Workflow 的占位实现，后续可替换为实际 API。
- `components/iac/CloudIacCatalog.tsx`：渲染左侧筛选与右侧卡片网格，并处理弹窗交互。
- `components/iac/RunModal.tsx`：运行确认弹窗，展示模块信息与 JSON 参数输入。

如需接入真实环境，可在 `catalog.ts` 中替换 Terraform 模块路径、Pulumi 组件名称或 GitHub Workflow 文件名，并在 `actions.ts` 中对接内部 API / 消息队列。

## 与 CI / IaC 系统集成

1. **Terraform / Pulumi**：在 `runTerraformModule` 与 `runPulumiProgram` 中调用内部 API（例如触发 Terraform Cloud、Atlantis、Pulumi Service 或自建执行引擎）。
2. **GitHub CI**：在 `triggerGithubWorkflow` 中调用 GitHub REST / GraphQL API，或将请求转发至现有的 GitHub App 服务。
3. **参数传递**：弹窗中的 JSON 参数会原样传入上述动作处理函数，可用于指定环境、凭证、变量文件等运行上下文。

## Feature Flag

`next.config.js` 会读取 `config/feature-toggles.json` 中的 `appModules.cloud_iac` 配置以决定入口是否展示与页面是否可访问。将该节点的 `enabled` 设置为 `false`（或为特定云厂商 / 服务节点设为 `false`）即可在生产环境中按需关闭。
