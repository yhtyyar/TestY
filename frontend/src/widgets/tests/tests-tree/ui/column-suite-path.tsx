import { Row } from "@tanstack/react-table"

import { TreeNode } from "shared/ui/tree"

interface Props<T> {
  row: Row<T>
}

export const ColumnSuitePath = <T extends TreeNode<Test>>({ row }: Props<T>) => {
  return (
    <span data-testid={`${row.original.data.suite_path}-suite_path`}>
      {row.original.data.suite_path}
    </span>
  )
}
