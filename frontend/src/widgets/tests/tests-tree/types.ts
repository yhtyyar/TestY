import { BaseTreeNodeProps } from "shared/ui/tree"

export interface TestsTreeNodeProps extends BaseTreeNodeProps {
  isLeaf: boolean
  total_count: number | null
}
