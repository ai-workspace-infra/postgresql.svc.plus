import type { CategoryKey } from './types'

export type SpecRow = {
  label: string
  defaultValue: string
  description: string
}

export type PreviewItem = {
  title: string
  description: string
}

export type CostItem = {
  title: string
  amount: string
  unit: string
  description: string
}

export type OutputItem = {
  title: string
  value: string
  description: string
}

type Context = {
  category: CategoryKey
  productName: string
  providerLabel: string
}

type SpecBuilder = (context: Context) => SpecRow[]
type PreviewBuilder = (context: Context) => PreviewItem[]
type CostBuilder = (context: Context) => CostItem[]
type OutputBuilder = (context: Context) => OutputItem[]

const SPEC_PRESETS: Partial<Record<CategoryKey, SpecBuilder>> = {
  compute: () => [
    { label: '实例规格', defaultValue: 't3.medium', description: '默认双核 4GB，适合通用业务与测试环境。' },
    { label: '节点数量', defaultValue: '2', description: '可按需调整 Auto Scaling 期望容量。' },
    { label: '操作系统', defaultValue: 'Amazon Linux 2023', description: '可替换为企业自定义镜像或 Golden Image。' },
  ],
  network: () => [
    { label: 'VPC 网段', defaultValue: '10.0.0.0/16', description: '核心业务网段范围，需避免与现有网络冲突。' },
    { label: '公有子网数量', defaultValue: '2', description: '承载负载均衡与 NAT 资源，跨可用区部署。' },
    { label: '私有子网数量', defaultValue: '2', description: '运行业务应用、数据库与内网服务。' },
  ],
  load_balancer: () => [
    { label: '负载均衡类型', defaultValue: '应用型（七层）', description: '可根据协议需求切换为网络型或网关型。' },
    { label: '监听端口', defaultValue: '80 / 443', description: '默认开启 HTTPS 并自动申请/挂载证书。' },
    { label: '健康检查阈值', defaultValue: '成功 3 · 失败 5', description: '控制后端目标移除与恢复的敏感程度。' },
  ],
  storage: () => [
    { label: '存储级别', defaultValue: '标准', description: '兼顾成本与性能的通用对象存储等级。' },
    { label: '版本管理', defaultValue: '启用', description: '记录对象历史版本，满足审计与快速回滚。' },
    { label: '生命周期策略', defaultValue: '30 天转低频', description: '自动迁移冷数据，降低长期存储成本。' },
  ],
  database: () => [
    { label: '数据库引擎', defaultValue: 'PostgreSQL 14', description: '可切换为 MySQL、SQL Server 等兼容引擎。' },
    { label: '实例规格', defaultValue: '2 vCPU · 8 GiB', description: '默认通用型配置，支持垂直扩展。' },
    { label: '存储类型', defaultValue: '100 GiB GP3', description: '通用型 SSD，支持自动增长与性能调优。' },
  ],
  cache: () => [
    { label: '节点类型', defaultValue: 'cache.m6g.large', description: '4 vCPU / 13 GiB 内存，适合会话和排行榜场景。' },
    { label: '分片数量', defaultValue: '3', description: '采用集群模式分摊热点压力，可水平扩展。' },
    { label: '备份策略', defaultValue: '每日 03:00', description: '配置自动备份窗口与数据保留周期。' },
  ],
  queue: () => [
    { label: '消息保留期', defaultValue: '4 天', description: '超期未消费的消息将被清理，可按需延长。' },
    { label: '可见性超时', defaultValue: '30 秒', description: '控制消费者处理时间，避免重复投递。' },
    { label: '死信队列', defaultValue: '启用', description: '失败重试超过阈值后转入死信队列分析。' },
  ],
  container: () => [
    { label: 'Kubernetes 版本', defaultValue: '1.27', description: '默认对齐 LTS 版本，可在升级窗口切换。' },
    { label: '节点池规格', defaultValue: 'm6i.large × 3', description: '默认工作节点池配置，支持多节点池。' },
    { label: '网络插件', defaultValue: '原生 CNI', description: '兼容服务网格与零信任策略。' },
  ],
  data_service: () => [
    { label: '计算框架', defaultValue: 'Apache Spark 3.x', description: '用于批处理、SQL 与流式计算任务。' },
    { label: '核心节点数量', defaultValue: '3', description: '可根据作业并发和 SLA 调整集群规模。' },
    { label: '自动扩缩容', defaultValue: '启用', description: '按队列任务量动态扩缩计算资源。' },
  ],
  security: () => [
    { label: '入站规则', defaultValue: '允许 80 / 443', description: '开放 Web 流量并限制来源网段。' },
    { label: '出站规则', defaultValue: '全部放行', description: '默认允许访问外部网络，可按需收紧策略。' },
    { label: '日志与告警', defaultValue: '开启', description: '接入云监控与日志服务获取安全事件。' },
  ],
  iam: () => [
    { label: '角色模板', defaultValue: '应用只读', description: '基于最小权限原则创建访问策略。' },
    { label: '多因子策略', defaultValue: '管理员必需', description: '高危操作账户需强制启用 MFA。' },
    { label: '审计日志保留', defaultValue: '365 天', description: '满足合规与安全回溯要求。' },
  ],
}

const RESOURCE_PRESETS: Partial<Record<CategoryKey, PreviewBuilder>> = {
  compute: ({ productName }) => [
    { title: 'Auto Scaling Group', description: '跨 2 个可用区部署，关联弹性伸缩策略与健康检查。' },
    { title: productName, description: '默认创建 2 台计算节点，挂载业务安全组与监控代理。' },
    { title: '安全组与日志', description: '开放 SSH 与业务端口，审计日志接入 CloudWatch / Log Service。' },
  ],
  network: () => [
    { title: 'VPC 主网段', description: '核心业务私有网络，提供路由与 ACL 控制。' },
    { title: '公有子网', description: '承载负载均衡、NAT 网关等出入口资源。' },
    { title: '私有子网', description: '部署应用、数据库、缓存等内部服务。' },
  ],
  load_balancer: ({ productName }) => [
    { title: productName, description: '多可用区部署，自动扩缩容应对流量高峰。' },
    { title: '监听器与证书', description: '预置 HTTP/HTTPS 监听，自动挂载 TLS 证书。' },
    { title: '访问日志', description: '负载均衡访问日志落地到对象存储供分析。' },
  ],
  storage: ({ productName }) => [
    { title: productName, description: '启用版本管理与跨区域复制，保障数据耐久性。' },
    { title: '生命周期规则', description: '自动将冷数据转入低频或归档存储。' },
    { title: '事件通知', description: '对象变更触发消息队列或函数服务，便于构建数据管道。' },
  ],
  database: ({ productName }) => [
    { title: productName, description: '部署在私有子网，启用多可用区高可用架构。' },
    { title: '参数组与监控', description: '预置性能参数模板，接入 CloudWatch 或 Azure Monitor。' },
    { title: '备份策略', description: '自动备份存储于对象存储，可快速恢复。' },
  ],
  cache: ({ productName }) => [
    { title: productName, description: '创建分片集群支持水平扩展与自动故障转移。' },
    { title: '参数组', description: '应用延迟最优配置，支持最大连接数监控。' },
    { title: '维护窗口', description: '定义升级窗口，保障业务连续性。' },
  ],
  queue: ({ productName }) => [
    { title: productName, description: '标准队列启用服务端加密与访问控制。' },
    { title: '死信队列', description: '自动绑定死信队列，方便排查异常消息。' },
    { title: '触发器示例', description: '可绑定函数或容器任务，实现事件驱动。' },
  ],
  container: ({ productName }) => [
    { title: productName, description: '控制面托管由云厂商负责，简化集群运维。' },
    { title: '工作节点池', description: '默认节点池启用自动伸缩与滚动升级。' },
    { title: '可观测性组件', description: '部署指标采集、日志收集与 Ingress 控制器。' },
  ],
  data_service: ({ productName }) => [
    { title: productName, description: 'Master/Worker 架构按需伸缩，支持按作业计费。' },
    { title: '数据湖集成', description: '默认挂载对象存储作为数据湖与结果输出。' },
    { title: 'Notebook & 作业入口', description: '提供交互式 Notebook、批处理作业与调度编排。' },
  ],
  security: ({ productName }) => [
    { title: productName, description: '集中管理网络安全策略，统一入站与出站控制。' },
    { title: '预置规则模板', description: '包含 Web、SSH、数据库等常见端口的安全策略。' },
    { title: '日志与审计集成', description: '将安全事件推送到云原生日志与告警系统。' },
  ],
  iam: ({ productName }) => [
    { title: productName, description: '集中管理用户、角色与策略，统一访问控制。' },
    { title: '自定义策略', description: '预置最小权限策略模版，支持自定义扩展。' },
    { title: '审计集成', description: '与 CloudTrail / ActionTrail 等审计服务打通。' },
  ],
}

const COST_PRESETS: Partial<Record<CategoryKey, CostBuilder>> = {
  compute: () => [
    { title: '计算实例', amount: '~$120', unit: '每月', description: '2 台按量付费 t3.medium 实例（含折扣）。' },
    { title: '块存储', amount: '~$18', unit: '每月', description: '100 GiB 通用型 SSD 存储与快照。' },
    { title: '监控与日志', amount: '~$5', unit: '每月', description: '指标采集、告警与日志保留成本估算。' },
  ],
  network: () => [
    { title: 'NAT 网关与带宽', amount: '~$45', unit: '每月', description: '含 2 个 NAT 网关及基础带宽消耗。' },
    { title: '流量镜像 / 日志', amount: '~$8', unit: '每月', description: 'VPC Flow Logs 与 Traffic Mirroring 数据存储。' },
    { title: '弹性 IP', amount: '~$6', unit: '每月', description: '2 个弹性公网 IP 的保留费用。' },
  ],
  load_balancer: () => [
    { title: '负载均衡实例', amount: '~$30', unit: '每月', description: '基础计费含 2 个可用区冗余。' },
    { title: '处理流量', amount: '~$25', unit: '每月', description: '按 500 GB 入站/出站流量预估。' },
    { title: '证书与 WAF', amount: '~$12', unit: '每月', description: '可选的证书托管与基础防护。' },
  ],
  storage: () => [
    { title: '标准存储', amount: '~$35', unit: '每月', description: '2 TB 热数据标准存储容量。' },
    { title: '低频存储', amount: '~$10', unit: '每月', description: '自动分层后的低频/归档存储。' },
    { title: '请求与数据传输', amount: '~$6', unit: '每月', description: 'PUT/GET 请求与跨区域复制流量。' },
  ],
  database: () => [
    { title: '数据库实例', amount: '~$280', unit: '每月', description: '单主多从架构的计算与 License 费用。' },
    { title: '存储与备份', amount: '~$40', unit: '每月', description: '自动备份与日志保留所产生的存储。' },
    { title: '监控与告警', amount: '~$12', unit: '每月', description: '性能洞察、慢查询分析等附加服务。' },
  ],
  cache: () => [
    { title: '缓存节点', amount: '~$150', unit: '每月', description: '3 分片主从节点的按量成本。' },
    { title: '数据传输', amount: '~$20', unit: '每月', description: '跨可用区复制与出站流量估算。' },
    { title: '备份存储', amount: '~$5', unit: '每月', description: '每日备份文件保留 7 天的成本。' },
  ],
  queue: () => [
    { title: '请求费用', amount: '~$4', unit: '每月', description: '按 1 亿次 API 请求计费。' },
    { title: '数据传输', amount: '~$3', unit: '每月', description: '跨可用区或跨区域消息传输。' },
    { title: '可选长轮询', amount: '~$1', unit: '每月', description: '长轮询连接占用的额外费用。' },
  ],
  container: () => [
    { title: '工作节点', amount: '~$360', unit: '每月', description: '3 台 m6i.large 按量付费节点。' },
    { title: '控制面', amount: '~$70', unit: '每月', description: '托管控制面的固定费用。' },
    { title: '弹性扩容', amount: '~$45', unit: '每月', description: '按峰值弹性节点额外成本估算。' },
  ],
  data_service: () => [
    { title: '计算节点', amount: '~$520', unit: '每月', description: '核心与任务节点 24x7 运行的费用。' },
    { title: '存储与快照', amount: '~$85', unit: '每月', description: '作业结果及日志在对象存储的占用。' },
    { title: '数据传输', amount: '~$40', unit: '每月', description: 'ETL 与跨区域同步产生的带宽。' },
  ],
  security: () => [
    { title: '安全策略管理', amount: '~$5', unit: '每月', description: '安全组 / 防火墙规则的基础管理费用。' },
    { title: '日志与监控', amount: '~$3', unit: '每月', description: '安全事件写入日志服务与监控告警的成本。' },
    { title: '合规加固', amount: '~$4', unit: '每月', description: '按需启用配置基线与漏洞扫描服务。' },
  ],
  iam: () => [
    { title: '身份目录', amount: '~$6', unit: '每月', description: '用户、组与角色的基础管理成本。' },
    { title: '审计日志', amount: '~$3', unit: '每月', description: '审计事件写入与存储费用。' },
    { title: '安全附加服务', amount: '~$5', unit: '每月', description: '如条件访问、身份防护等高级功能。' },
  ],
}

const OUTPUT_PRESETS: Partial<Record<CategoryKey, OutputBuilder>> = {
  compute: () => [
    { title: '实例私网 IP', value: '10.0.1.12 / 10.0.2.15', description: '可用于上游注册与服务发现。' },
    { title: '弹性伸缩组 ARN', value: 'arn:aws:autoscaling:…:group/app-asg', description: '便于监控、告警或后续自动化引用。' },
    { title: 'Bastion 主机地址', value: 'bastion.dev.example.com', description: '运维访问入口，默认限制公司 VPN 网段。' },
  ],
  network: () => [
    { title: 'VPC ID', value: 'vpc-0ab1cdef234567890', description: '核心网络标识，用于后续资源关联。' },
    { title: '公有子网列表', value: 'subnet-0a1b…, subnet-0c2d…', description: '供负载均衡、NAT 等资源选择。' },
    { title: '私有路由表', value: 'rtb-0f12abcd3456ef789', description: '内网路由策略，含默认与自定义路由。' },
  ],
  load_balancer: () => [
    { title: '应用入口域名', value: 'alb.dev.example.com', description: '对外访问入口，可配置 DNS CNAME。' },
    { title: '监听端口', value: '80 / 443', description: '已开启 HTTP → HTTPS 自动跳转。' },
    { title: '日志存储桶', value: 's3://alb-access-log-bucket', description: '负载均衡访问日志归档位置。' },
  ],
  storage: () => [
    { title: '存储桶名称', value: 'acme-app-artifacts', description: '作为统一对象存储入口。' },
    { title: '默认区域', value: 'ap-southeast-1', description: '与主要业务部署地保持一致。' },
    { title: '访问策略', value: 'arn:aws:iam::123456789012:policy/storage-access', description: '附加到应用角色实现读写权限。' },
  ],
  database: () => [
    { title: '数据库终端节点', value: 'db-instance.corp.local', description: '应用连接的主写入地址。' },
    { title: '监听端口', value: '5432', description: '默认 PostgreSQL 端口，可按需调整。' },
    { title: '只读实例', value: 'db-ro-1, db-ro-2', description: '用于报表、BI 等只读场景。' },
  ],
  cache: () => [
    { title: '连接地址', value: 'redis://cache-cluster:6379', description: '业务接入使用的统一 Endpoint。' },
    { title: '集群拓扑', value: '3 shards × 1 replica', description: '当前分片与副本配置。' },
    { title: '参数组', value: 'elasticache-default-redis6', description: '关联的参数模版，便于审计与回滚。' },
  ],
  queue: () => [
    { title: '队列 URL', value: 'https://sqs.ap-east-1.amazonaws.com/123456789012/app-queue', description: '生产者/消费者访问的 HTTP 入口。' },
    { title: '最大消息大小', value: '256 KB', description: '超过阈值需要转存对象存储。' },
    { title: '可见性超时', value: '30 秒', description: '确保消费者处理完成后再重新投递。' },
  ],
  container: () => [
    { title: 'API Server Endpoint', value: 'https://XXXX.gr7.eks.amazonaws.com', description: 'kubectl 与 GitOps 控制面地址。' },
    { title: 'OIDC 提供商', value: 'https://oidc.eks.amazonaws.com/id/XXXX', description: '用于服务账号联邦认证。' },
    { title: '节点角色 ARN', value: 'arn:aws:iam::123456789012:role/eks-node', description: '附加到所有节点的 IAM Role。' },
  ],
  data_service: () => [
    { title: 'Master 节点 DNS', value: 'emr-master.internal', description: '提交作业与 SSH 登录入口。' },
    { title: '数据湖路径', value: 's3://analytics-raw/', description: '默认数据输入输出位置。' },
    { title: 'Spark History Server', value: 'https://emr-history.example.com', description: '用于审计与调试历史任务。' },
  ],
  security: () => [
    { title: '安全组 / 防火墙 ID', value: 'sg-0abc123456789def0', description: '用于后续资源绑定与变更。' },
    { title: '允许的来源网段', value: '10.0.0.0/16, 203.0.113.0/24', description: '当前放行的内部与外部网段。' },
    { title: '审计日志路径', value: 's3://security-logs/firewall/', description: '安全事件存储与分析位置。' },
  ],
  iam: () => [
    { title: '角色 ARN', value: 'arn:aws:iam::123456789012:role/app-readonly', description: '分配给应用服务的主角色。' },
    { title: '策略版本', value: 'v2024-04-15', description: '用于追踪权限变更历史。' },
    { title: '审计日志路径', value: 's3://org-cloudtrail/audit/', description: 'CloudTrail / ActionTrail 日志落地点。' },
  ],
}

const DEFAULT_SPEC_BUILDER: SpecBuilder = () => [
  {
    label: '自定义参数',
    defaultValue: '按服务需求配置',
    description: '该服务类别暂未提供默认模板，请根据实际情况补充配置。',
  },
]

const DEFAULT_PREVIEW_BUILDER: PreviewBuilder = () => [
  {
    title: '服务概览',
    description: '此类别尚未定义示例资源，请结合产品文档规划部署。',
  },
]

const DEFAULT_COST_BUILDER: CostBuilder = () => [
  {
    title: '预估成本',
    amount: '按使用计费',
    unit: 'USD/月',
    description: '根据配置选择与使用时长，参考各云厂商最新报价。',
  },
]

const DEFAULT_OUTPUT_BUILDER: OutputBuilder = () => [
  {
    title: '部署结果',
    value: '待填充',
    description: '可在 GitOps 或 IaC 管道中补充具体输出变量。',
  },
]

export function getSpecRows(context: Context): SpecRow[] {
  const builder = SPEC_PRESETS[context.category] ?? DEFAULT_SPEC_BUILDER
  return builder(context)
}

export function getResourcePreview(context: Context): PreviewItem[] {
  const builder = RESOURCE_PRESETS[context.category] ?? DEFAULT_PREVIEW_BUILDER
  return builder(context)
}

export function getCostPreview(context: Context): CostItem[] {
  const builder = COST_PRESETS[context.category] ?? DEFAULT_COST_BUILDER
  return builder(context)
}

export function getOutputPreview(context: Context): OutputItem[] {
  const builder = OUTPUT_PRESETS[context.category] ?? DEFAULT_OUTPUT_BUILDER
  return builder(context)
}
