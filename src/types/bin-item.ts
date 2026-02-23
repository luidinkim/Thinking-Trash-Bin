export type Priority = 'S' | 'A' | 'B'
export type BinItemStatus = 'open' | 'promoted' | 'resolved' | 'dropped'
export type BinScope = 'personal' | 'team'

export interface BinItem {
  id: string
  title: string
  priority: Priority
  tags: string[]
  author: string
  created: string          // ISO 8601
  status: BinItemStatus
  promoted_at: string | null
  // Body sections
  problem: string          // 문제 상황
  currentStructure: string // 현재 구조
  idea: string             // 개선 아이디어
  impact: string           // 영향 범위
  thinkingNotes: string    // 생각 노트 섹션 전체 원문
  // Metadata (not stored in frontmatter)
  filePath: string         // GitHub repo path
  sha: string              // Git blob SHA for updates
}

export interface TagDefinition {
  name: string
  color: string
}

export interface TagsConfig {
  tags: TagDefinition[]
}
