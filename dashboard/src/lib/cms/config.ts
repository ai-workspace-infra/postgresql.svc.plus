export type TemplateName = 'default' | (string & {})
export type ThemeName = 'default'
export type ExtensionName = 'app-shell' | 'markdown-sync'

export interface ContentSourceConfig {
  type: 'filesystem' | 'git'
  /**
   * Absolute path to the root directory that stores markdown content.
   * When `type` is `git`, the directory is expected to be hydrated by a
   * GitOps workflow ahead of time.
   */
  root: string
  /** Remote git repository used for GitOps synchronisation. */
  repository?: string
  /** Branch or tag to fetch when GitOps is enabled. */
  ref?: string
}

export interface CmsConfig {
  template: TemplateName
  theme: ThemeName
  extensions: ExtensionName[]
  content: {
    /** Default namespace used when a section does not override its source. */
    defaultNamespace: string
    sources: Record<string, ContentSourceConfig>
  }
}

export const cmsConfig: CmsConfig = {
  template: 'default',
  theme: 'default',
  extensions: ['app-shell', 'markdown-sync'],
  content: {
    defaultNamespace: 'homepage',
    sources: {
      homepage: {
        type: 'filesystem',
        root: 'src/lib/cms/content/homepage',
      },
      docs: {
        type: 'filesystem',
        root: 'src/lib/cms/content/docs',
      },
      marketing: {
        type: 'git',
        root: 'cms/content/marketing',
        repository: 'git@github.com:example/xcontrol-marketing.git',
        ref: 'main',
      },
    },
  },
}
