# 环境配置指南

## 1. 如何切换到 SIT 环境

### 方法一：使用环境变量（推荐）

在项目根目录设置环境变量：

```bash
# 切换到 SIT 环境
export RUNTIME_ENV=sit

# 或者使用其他支持的别名
export RUNTIME_ENV=staging
export RUNTIME_ENV=dev
export RUNTIME_ENV=development

# 然后启动服务
deno task dev
```

### 方法二：创建运行时配置文件

在项目根目录创建 `.runtime-env-config.yaml`：

```yaml
# .runtime-env-config.yaml
environment: sit
region: default
```

支持的位置（按优先级排序）：
1. `RUNTIME_ENV_CONFIG_PATH` 环境变量指定的路径
2. `dashboard/config/.runtime-env-config.yaml`
3. `config/.runtime-env-config.yaml`
4. `./.runtime-env-config.yaml`

### 方法三：使用 .env 文件

创建 `.env` 文件：

```bash
# .env
RUNTIME_ENV=sit
RUNTIME_REGION=default

# 可选：覆盖特定服务 URL
AUTH_URL=https://dev-accounts.svc.plus
API_BASE_URL=https://dev-api.svc.plus
DASHBOARD_URL=https://dev-console.svc.plus
```

## 2. 支持的环境值

### Environment（环境）

| 值 | 映射到 | 说明 |
|---|---|---|
| `prod`, `production`, `release`, `main`, `live` | **prod** | 生产环境 |
| `sit`, `staging`, `test`, `qa`, `uat`, `dev`, `development`, `preview`, `preprod` | **sit** | 测试/开发环境 |

**默认环境：** `prod`

### Region（区域）

| 值 | 说明 | 配置文件 |
|---|---|---|
| `default` | 默认区域 | `runtime-service-config.base.yaml` + `runtime-service-config.sit.yaml` |
| `cn` / `china` | 中国区 | 使用 `regions.cn` 配置 |
| `global` | 全球区 | 使用 `regions.global` 配置 |

**默认区域：** `default`

## 3. 配置文件说明

### SIT 环境配置

`config/runtime-service-config.sit.yaml`:

```yaml
# SIT 环境覆盖配置
apiBaseUrl: https://dev-api.svc.plus
authUrl: https://dev-accounts.svc.plus
dashboardUrl: https://dev-console.svc.plus
logLevel: debug
```

### PROD 环境配置

`config/runtime-service-config.prod.yaml`:

```yaml
# 生产环境配置（带区域支持）
logLevel: warn
regions:
  cn:
    apiBaseUrl: https://cn-api.svc.plus
    authUrl: https://cn-accounts.svc.plus
    dashboardUrl: https://cn-console.svc.plus
  global:
    apiBaseUrl: https://global-api.svc.plus
    authUrl: https://global-accounts.svc.plus
    dashboardUrl: https://global-console.svc.plus
```

### 基础配置

`config/runtime-service-config.base.yaml`:

```yaml
# 所有环境的基础配置
apiBaseUrl: https://api.svc.plus
authUrl: https://accounts.svc.plus
dashboardUrl: https://console.svc.plus
internalApiBaseUrl: http://127.0.0.1:8090
logLevel: info
```

## 4. 环境变量覆盖优先级

环境变量具有最高优先级，可以覆盖配置文件：

```bash
# 这些环境变量会覆盖配置文件中的值
export AUTH_URL=https://custom-auth.example.com
export ACCOUNT_SERVICE_URL=https://custom-auth.example.com
export API_BASE_URL=https://custom-api.example.com
export DASHBOARD_URL=https://custom-dashboard.example.com
```

**优先级顺序：**
1. 环境变量（最高）
2. 区域特定配置
3. 环境特定配置
4. 基础配置（最低）

## 5. 验证当前环境

启动服务时，会在日志中看到当前环境信息：

```bash
$ deno task dev

[runtime-config] Loading SIT environment, default region
[runtime-config] Loaded: authUrl=https://dev-accounts.svc.plus, apiBaseUrl=https://dev-api.svc.plus
```

## 6. 完整示例

### 示例 1：本地开发（SIT 环境）

```bash
# 设置环境
export RUNTIME_ENV=sit

# 启动开发服务器
deno task dev

# 或使用 make
make dev
```

### 示例 2：生产环境（中国区）

```bash
# 设置环境和区域
export RUNTIME_ENV=prod
export RUNTIME_REGION=cn

# 启动服务
deno task start
```

### 示例 3：自定义配置

```bash
# 完全自定义服务地址
export RUNTIME_ENV=sit
export AUTH_URL=https://my-custom-auth.example.com
export API_BASE_URL=https://my-custom-api.example.com

deno task dev
```

## 7. 常见问题

### Q: 如何确认当前使用的是哪个环境？
A: 查看启动日志中的 `[runtime-config]` 信息，会显示当前环境和配置。

### Q: 环境变量不生效？
A: 确保：
1. 环境变量在启动服务之前设置
2. 使用正确的环境变量名（见上述列表）
3. 检查是否有配置文件覆盖

### Q: 如何在 Docker 中设置环境？
A: 在 `docker-compose.yml` 或 Dockerfile 中设置环境变量：
```yaml
environment:
  - RUNTIME_ENV=sit
  - RUNTIME_REGION=default
```

### Q: 支持 .env 文件吗？
A: Deno Fresh 项目需要手动加载 .env 文件，建议直接使用环境变量或 YAML 配置文件。

## 8. 相关文件

- 配置加载器：`server/runtime-loader.deno.ts`
- 配置入口：`config/runtime-loader.ts`
- 配置文件目录：`config/runtime-service-config.*.yaml`
- 登录 API：`routes/api/auth/login.ts`
