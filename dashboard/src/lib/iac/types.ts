export type CategoryKey =
  | 'landing_zone'
  | 'compute'
  | 'network'
  | 'load_balancer'
  | 'storage'
  | 'database'
  | 'cache'
  | 'queue'
  | 'container'
  | 'data_service'
  | 'security'
  | 'iam'
  | 'dns_cdn'
  | 'edge_iot'
  | 'observability'
  | 'api_integration'

export type ProviderKey = 'aws' | 'gcp' | 'azure' | 'aliyun'

export type ProviderDefinition = {
  key: ProviderKey
  label: string
}

export type IacIntegration = {
  detailSlug: string
  githubWorkflow?: string
  githubInputs?: Record<string, any>
  gitlabPipeline?: string
  gitlabVariables?: Record<string, any>
}

export type CatalogItem = {
  key: CategoryKey
  title: string
  subtitle: string
  description: string
  highlights: string[]
  products: Partial<Record<ProviderKey, string>>
  iac?: Partial<Record<ProviderKey, IacIntegration>>
}

export type IaCTool = 'githubWorkflow' | 'gitlabPipeline'
