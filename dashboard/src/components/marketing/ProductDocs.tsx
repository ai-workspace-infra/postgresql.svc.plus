import Link from 'next/link'

import type { ProductConfig } from '@src/products/registry'

type ProductDocsProps = {
  config: ProductConfig
  lang: 'zh' | 'en'
}

export default function ProductDocs({ config, lang }: ProductDocsProps) {
  return (
    <section id="docs" aria-labelledby="docs-title" className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 id="docs-title" className="text-3xl font-bold text-slate-900">
              {lang === 'zh' ? '帮助文档' : 'Documentation'}
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              <li>
                1. {lang === 'zh' ? '下载并安装客户端' : 'Download and install the client'}
              </li>
              <li>
                2. {lang === 'zh' ? '注册或登录账户' : 'Sign up or sign in'}
              </li>
              <li>
                3. {lang === 'zh' ? '选择节点或启用自动分配' : 'Choose a node or use auto selection'}
              </li>
              <li>
                4. {lang === 'zh' ? '开始加速并查看监控' : 'Start acceleration with live metrics'}
              </li>
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={config.docsQuickstart}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {lang === 'zh' ? '快速开始指南' : 'Quickstart'}
              </Link>
              <Link
                href={config.docsIssues}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                GitHub
              </Link>
              <Link
                href={config.videosUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {lang === 'zh' ? '视频教程' : 'Video tutorials'}
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              {lang === 'zh' ? '文档资源' : 'Resource links'}
            </h3>
            <ul className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <li>
                <Link
                  href={config.docsQuickstart}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                >
                  {lang === 'zh' ? '快速开始' : 'Quickstart'}
                </Link>
              </li>
              <li>
                <Link
                  href={config.docsApi}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                >
                  API
                </Link>
              </li>
              <li>
                <Link
                  href={config.docsIssues}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                >
                  {lang === 'zh' ? '故障排查' : 'Issues'}
                </Link>
              </li>
              <li>
                <Link
                  href={config.blogUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                >
                  {lang === 'zh' ? '官方博客' : 'Official blog'}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
