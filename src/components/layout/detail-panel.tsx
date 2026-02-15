import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useBin } from '../../contexts/bin-context'
import type { BinItem, Priority } from '../../types/bin-item'

interface DetailPanelProps {
  onPromote?: (item: BinItem) => void
  onResolve?: (item: BinItem) => void
  onDrop?: (item: BinItem) => void
}

const priorityLabels: Record<Priority, string> = {
  S: 'S — 즉시 수정',
  A: 'A — 다음 사이클',
  B: 'B — 미래 개선',
}

const priorityBadgeColors: Record<Priority, string> = {
  S: 'bg-red-500/20 text-red-400 border-red-500/30',
  A: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  B: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

function buildMarkdownBody(item: BinItem): string {
  const sections: string[] = []

  if (item.problem) {
    sections.push(`## 문제 상황\n\n${item.problem}`)
  }
  if (item.currentStructure) {
    sections.push(`## 현재 구조\n\n${item.currentStructure}`)
  }
  if (item.idea) {
    sections.push(`## 개선 아이디어\n\n${item.idea}`)
  }
  if (item.impact) {
    sections.push(`## 영향 범위\n\n${item.impact}`)
  }

  return sections.join('\n\n')
}

export function DetailPanel({ onPromote, onResolve, onDrop }: DetailPanelProps) {
  const { selectedItem, scope } = useBin()

  if (!selectedItem) {
    return (
      <div className="flex-1 h-full bg-gray-950 flex items-center justify-center">
        <p className="text-gray-600 text-sm">항목을 선택하세요</p>
      </div>
    )
  }

  const body = buildMarkdownBody(selectedItem)
  const createdDate = new Date(selectedItem.created).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex-1 h-full bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-100">{selectedItem.title}</h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded border ${priorityBadgeColors[selectedItem.priority]}`}
              >
                {priorityLabels[selectedItem.priority]}
              </span>
              {selectedItem.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>{selectedItem.author}</span>
              <span>{createdDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose prose-invert prose-sm max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-800 flex gap-2">
        {scope === 'personal' && (
          <button
            onClick={() => onPromote?.(selectedItem)}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            팀 승격
          </button>
        )}
        <button
          onClick={() => onResolve?.(selectedItem)}
          className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
        >
          해결됨
        </button>
        <button
          onClick={() => onDrop?.(selectedItem)}
          className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          폐기
        </button>
      </div>
    </div>
  )
}
