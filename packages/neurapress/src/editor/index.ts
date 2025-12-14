import { convertToWechat, defaultOptions } from '../lib/markdown'
import { getExampleContent } from '../lib/utils/loadExampleContent'
import XiaohongshuEditor from '../components/editor/XiaohongshuEditor'
import WechatEditor from '../components/editor/WechatEditor'

export const neurapressSample = getExampleContent()

export function renderMarkdown(markdown: string): string {
  return convertToWechat(markdown, defaultOptions)
}

export const Editor = WechatEditor
export { WechatEditor, XiaohongshuEditor }
