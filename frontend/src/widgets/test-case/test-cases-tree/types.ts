import { BaseTreeNodeProps } from "shared/ui/tree"

export interface TestCasesTreeNodeProps extends BaseTreeNodeProps {
  isLeaf: boolean
  total_count: number | null
}
