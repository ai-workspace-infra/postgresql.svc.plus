/**
 * AskAI Button Island - Fresh + Preact
 *
 * Floating AI assistant button with keyboard shortcut
 */

import { useSignal } from '@preact/signals'

interface AskAIButtonProps {
  language: 'zh' | 'en'
}

export default function AskAIButton({ language }: AskAIButtonProps) {
  const isDialogOpen = useSignal(false)

  const openDialog = () => {
    isDialogOpen.value = true
  }

  const closeDialog = () => {
    isDialogOpen.value = false
  }

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={openDialog}
        class="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        aria-label="Ask AI"
      >
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* AI Dialog */}
      {isDialogOpen.value && (
        <AskAIDialog language={language} onClose={closeDialog} />
      )}
    </>
  )
}

interface AskAIDialogProps {
  language: 'zh' | 'en'
  onClose: () => void
}

function AskAIDialog({ language, onClose }: AskAIDialogProps) {
  const question = useSignal('')
  const isLoading = useSignal(false)
  const answer = useSignal('')

  const handleSubmit = async (e: Event) => {
    e.preventDefault()

    if (!question.value.trim() || isLoading.value) {
      return
    }

    isLoading.value = true
    answer.value = ''

    try {
      const response = await fetch('/api/askai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.value }),
      })

      if (response.ok) {
        const data = await response.json()
        answer.value = data.answer || (language === 'zh' ? '无法获取回答' : 'No answer available')
      } else {
        answer.value = language === 'zh' ? '请求失败，请稍后重试' : 'Request failed, please try again'
      }
    } catch (error) {
      console.error('Ask AI error:', error)
      answer.value = language === 'zh' ? '网络错误，请检查连接' : 'Network error, please check connection'
    } finally {
      isLoading.value = false
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        class="fixed inset-0 z-50 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Dialog Panel */}
      <div
        class="fixed inset-x-4 top-20 z-50 max-w-3xl mx-auto"
        onKeyDown={handleKeyDown}
      >
        <div class="bg-white rounded-lg shadow-2xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div class="flex items-center space-x-3">
              <div class="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900">
                  {language === 'zh' ? 'AI 助手' : 'AI Assistant'}
                </h2>
                <p class="text-sm text-gray-500">
                  {language === 'zh' ? '有什么可以帮助您的？' : 'How can I help you?'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              class="text-gray-400 hover:text-gray-600 transition"
              aria-label="Close"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div class="flex-1 overflow-y-auto p-6">
            {/* Question Form */}
            <form onSubmit={handleSubmit} class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'zh' ? '您的问题' : 'Your Question'}
                </label>
                <textarea
                  value={question.value}
                  onInput={(e) => question.value = (e.target as HTMLTextAreaElement).value}
                  placeholder={language === 'zh'
                    ? '例如：如何部署 Kubernetes 集群？'
                    : 'e.g., How to deploy a Kubernetes cluster?'
                  }
                  rows={4}
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  disabled={isLoading.value}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading.value || !question.value.trim()}
                class="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading.value
                  ? (language === 'zh' ? '思考中...' : 'Thinking...')
                  : (language === 'zh' ? '提问' : 'Ask')
                }
              </button>
            </form>

            {/* Answer */}
            {answer.value && (
              <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 class="text-sm font-semibold text-gray-700 mb-2">
                  {language === 'zh' ? 'AI 回答：' : 'AI Answer:'}
                </h3>
                <div class="text-sm text-gray-900 whitespace-pre-wrap">
                  {answer.value}
                </div>
              </div>
            )}

            {/* Suggested Questions */}
            {!answer.value && !isLoading.value && (
              <div class="mt-6">
                <p class="text-sm font-medium text-gray-700 mb-3">
                  {language === 'zh' ? '建议问题：' : 'Suggested Questions:'}
                </p>
                <div class="space-y-2">
                  {(language === 'zh' ? [
                    '如何开始使用 Cloud-Neutral？',
                    'XCloudFlow 支持哪些云平台？',
                    '如何配置多集群管理？',
                  ] : [
                    'How to get started with Cloud-Neutral?',
                    'Which cloud platforms does XCloudFlow support?',
                    'How to configure multi-cluster management?',
                  ]).map((suggested) => (
                    <button
                      key={suggested}
                      onClick={() => question.value = suggested}
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-purple-300 transition"
                    >
                      {suggested}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
