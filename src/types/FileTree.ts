export interface FileTreeItem {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileTreeItem[]
  isExpanded?: boolean
}

export interface FileTreeNode extends FileTreeItem {
  level: number
  parent?: FileTreeNode
}