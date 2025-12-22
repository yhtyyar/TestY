import { Row } from "@tanstack/react-table"

import { TreeNode } from "shared/ui/tree"

const isSuite = (data: TestCase | Suite): data is Suite => {
  return data.is_leaf === true
}

interface Props<T> {
  row: Row<T>
}

export const ColumnEstimate = <T extends TreeNode<TestCase | Suite>>({ row }: Props<T>) => {
  const data = row.original.data
  let estimate: string | null | undefined
  if (isSuite(data)) {
    estimate = data.total_estimates
  } else {
    estimate = data.estimate
  }

  return <span data-testid={`${estimate}-estimate`}>{estimate ?? "-"}</span>
}
