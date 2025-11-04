import type { CatalogItem, IaCTool, ProviderKey } from './types'

export type ActionResult = {
  success: boolean
  message: string
  timestamp: string
}

export type BaseActionParams = {
  provider: ProviderKey
  category: CatalogItem
  parameters?: Record<string, any>
}

export type GithubWorkflowParams = BaseActionParams & {
  workflow: string
}

export type GitlabPipelineParams = BaseActionParams & {
  pipeline: string
}

const SIMULATED_LATENCY = 600

async function simulateNetworkDelay() {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY))
}

function buildMessage(tool: IaCTool, provider: ProviderKey, identifier: string) {
  const upperProvider = provider.toUpperCase()
  switch (tool) {
    case 'githubWorkflow':
      return `GitHub Workflow ${identifier} 已触发 ${upperProvider} 的自动化流程。`
    case 'gitlabPipeline':
      return `GitLab Pipeline ${identifier} 已提交至 ${upperProvider} 的 CI 平台。`
    default:
      return `${identifier} execution started for ${upperProvider}.`
  }
}

function buildResult(tool: IaCTool, provider: ProviderKey, identifier: string): ActionResult {
  return {
    success: true,
    message: buildMessage(tool, provider, identifier),
    timestamp: new Date().toISOString(),
  }
}

export async function triggerGithubWorkflow({ provider, category, workflow, parameters }: GithubWorkflowParams): Promise<ActionResult> {
  await simulateNetworkDelay()
  return buildResult('githubWorkflow', provider, `${workflow} (${category.key})`)
}

export async function triggerGitlabPipeline({ provider, category, pipeline, parameters }: GitlabPipelineParams): Promise<ActionResult> {
  await simulateNetworkDelay()
  return buildResult('gitlabPipeline', provider, `${pipeline} (${category.key})`)
}
