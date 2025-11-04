export interface AlertConfig {
  name: string
  description: string
  condition: string
  severity: 'info' | 'warning' | 'critical'
  silenceMinutes?: number
  receivers: string[]
}

export interface GitOpsPreview {
  branch: string
  filePath: string
  diff: string
}

export async function createAlertPR(config: AlertConfig): Promise<GitOpsPreview> {
  const diff = `--- a/alerts/${config.name}.yaml\n+++ b/alerts/${config.name}.yaml\n` +
    `+name: ${config.name}\n` +
    `+description: ${config.description}\n` +
    `+condition: ${config.condition}\n` +
    `+severity: ${config.severity}\n`
  await new Promise(resolve => setTimeout(resolve, 400))
  return {
    branch: `alerts/${config.name}`,
    filePath: `alerts/${config.name}.yaml`,
    diff
  }
}
