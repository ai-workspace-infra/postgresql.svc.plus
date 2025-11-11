export type VlessEndpoint = {
  host: string
  port: number
  type: string
  security: string
  flow: string
  encryption: string
  serverName: string
  fingerprint: string
  allowInsecure: boolean
  label: string
}

export type VlessTemplate = {
  endpoint: VlessEndpoint
}

const DEFAULT_VLESS_TEMPLATE: VlessTemplate = {
  endpoint: {
    host: 'tky-connector.onwalk.net',
    port: 1443,
    type: 'tcp',
    security: 'tls',
    flow: 'xtls-rprx-vision',
    encryption: 'none',
    serverName: 'tky-connector.onwalk.net',
    fingerprint: 'chrome',
    allowInsecure: false,
    label: 'Tokyo-Node',
  },
}

const DEFAULT_XRAY_CONFIG = {
  log: {
    loglevel: 'info',
  },
  routing: {
    domainStrategy: 'IPIfNonMatch',
    rules: [
      {
        type: 'field',
        ip: ['geoip:private', 'geoip:cn'],
        outboundTag: 'direct',
      },
      {
        type: 'field',
        domain: ['geosite:cn'],
        outboundTag: 'direct',
      },
      {
        type: 'field',
        network: 'tcp,udp',
        outboundTag: 'proxy',
      },
    ],
  },
  inbounds: [
    {
      listen: '127.0.0.1',
      port: 1080,
      protocol: 'socks',
      settings: {
        udp: true,
      },
      sniffing: {
        enabled: true,
        destOverride: ['http', 'tls'],
      },
    },
    {
      listen: '127.0.0.1',
      port: 1081,
      protocol: 'http',
      sniffing: {
        enabled: true,
        destOverride: ['http', 'tls'],
      },
    },
  ],
  outbounds: [
    {
      protocol: 'vless',
      settings: {
        vnext: [
          {
            address: 'tky-connector.onwalk.net',
            port: 1443,
            users: [
              {
                id: '',
                encryption: 'none',
                flow: 'xtls-rprx-vision',
              },
            ],
          },
        ],
      },
      streamSettings: {
        network: 'tcp',
        security: 'tls',
        tlsSettings: {
          serverName: 'tky-connector.onwalk.net',
          allowInsecure: false,
          fingerprint: 'chrome',
        },
      },
      tag: 'proxy',
    },
    {
      protocol: 'freedom',
      tag: 'direct',
    },
    {
      protocol: 'blackhole',
      tag: 'block',
    },
  ],
}

export type XrayConfig = typeof DEFAULT_XRAY_CONFIG

export function buildVlessUri(rawUuid: string | null | undefined): string | null {
  const uuid = (rawUuid ?? '').trim()
  if (!uuid) {
    return null
  }

  const { endpoint } = DEFAULT_VLESS_TEMPLATE

  const params = new URLSearchParams({
    type: endpoint.type,
    security: endpoint.security,
    flow: endpoint.flow,
    encryption: endpoint.encryption,
    sni: endpoint.serverName,
    fp: endpoint.fingerprint,
    allowInsecure: endpoint.allowInsecure ? '1' : '0',
  })

  return `vless://${uuid}@${endpoint.host}:${endpoint.port}?${params.toString()}#${encodeURIComponent(endpoint.label)}`
}

export function buildVlessConfig(rawUuid: string | null | undefined): XrayConfig | null {
  const uuid = (rawUuid ?? '').trim()
  if (!uuid) {
    return null
  }

  const config = JSON.parse(JSON.stringify(DEFAULT_XRAY_CONFIG)) as XrayConfig
  const user = config.outbounds?.[0]?.settings?.vnext?.[0]?.users?.[0]
  if (user) {
    user.id = uuid
  }

  return config
}

export function serializeConfigForDownload(config: XrayConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`
}

export const DEFAULT_VLESS_LABEL = DEFAULT_VLESS_TEMPLATE.endpoint.label
