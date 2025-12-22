import { Row } from "@tanstack/react-table"

import { TreeNode } from "shared/ui/tree"

interface Props<T> {
  row: Row<T>
}

export const ColumnEstimate = <T extends TreeNode<Test | TestPlan>>({ row }: Props<T>) => {
  return (
    <span data-testid={`${row.original.data.estimate}-estimate`}>
      {row.original.data.estimate ?? "-"}
    </span>
  )
}
