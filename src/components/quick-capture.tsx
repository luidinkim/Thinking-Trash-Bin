import { useState, useEffect, useRef } from 'react'
import type { Priority } from '../types/bin-item'

export interface QuickCaptureData {
  title: string
  priority: Priority
  tags: string[]
  problem: string
  currentStructure: string
  idea: string
  impact: string
}

interface QuickCaptureProps {
  open: boolean
  onClose: () => void
  onSave: (data: QuickCaptureData) => void
  availableTags: string[]
}

const PRIORITY_STYLES: Record<Priority, { active: string; label: string }> = {
  S: {
    active: 'border-red-500 bg-red-500/20 text-red-400',
    label: 'S',
  },
  A: {
    active: 'border-yellow-500 bg-yellow-500/20 text-yellow-400',
    label: 'A',
  },
  B: {
    active: 'border-blue-500 bg-blue-500/20 text-blue-400',
    label: 'B',
  },
}

export function QuickCapture({ open, onClose, onSave, availableTags }: QuickCaptureProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('B')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)
  const [problem, setProblem] = useState('')
  const [currentStructure, setCurrentStructure] = useState('')
  const [idea, setIdea] = useState('')
  const [impact, setImpact] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && titleRef.current) {
      titleRef.current.focus()
    }
  }, [open])

  if (!open) return null

  const resetFields = () => {
    setTitle('')
    setPriority('B')
    setSelectedTags([])
    setExpanded(false)
    setProblem('')
    setCurrentStructure('')
    setIdea('')
    setImpact('')
  }

  const handleSave = () => {
    onSave({
      title,
      priority,
      tags: selectedTags,
      problem,
      currentStructure,
      idea,
      impact,
    })
    resetFields()
    onClose()
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onClose}
        data-testid="quick-capture-backdrop"
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up"
        role="dialog"
        aria-label="Quick Capture"
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-100">Quick Capture</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Title input */}
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />

          {/* Priority selector */}
          <div className="flex gap-2">
            {(Object.keys(PRIORITY_STYLES) as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  priority === p
                    ? PRIORITY_STYLES[p].active
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {PRIORITY_STYLES[p].label}
              </button>
            ))}
          </div>

          {/* Tag selector */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Expand button */}
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            {expanded ? '상세 필드 접기' : '상세 필드 펼치기'}
          </button>

          {/* Expanded detail fields */}
          {expanded && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">문제 상황</label>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">현재 구조</label>
                <textarea
                  value={currentStructure}
                  onChange={(e) => setCurrentStructure(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">개선 아이디어</label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">영향 범위</label>
                <textarea
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={title.trim() === ''}
            className="w-full py-2.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            저장하고 계속 작업
          </button>
        </div>
      </div>
    </>
  )
}
