interface ThinkingMemoProps {
  value: string
  onChange: (value: string) => void
}

export function ThinkingMemo({ value, onChange }: ThinkingMemoProps) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-medium text-foreground mb-2">생각 노트</h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="자유롭게 생각을 기록하세요... (마크다운 지원)"
        className="flex-1 w-full bg-secondary/50 text-foreground border border-border rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
      />
    </div>
  )
}
