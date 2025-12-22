import { Row } from "@tanstack/react-table"

import { TreeNode } from "shared/ui/tree"

export const getLinkTest = (
  row: Row<TreeNode<Test | TestPlan>>,
  projectId: number,
  testPlanId?: number | null
) => {
  const queryParams = new URLSearchParams(location.search)

  if (!row.original.data.is_leaf) {
    return `/projects/${projectId}/plans/${row.original.data.id}?${queryParams.toString()}`
  }

  queryParams.set("test", String(row.original.data.id))
  return `/projects/${projectId}/plans/${testPlanId ?? ""}?${queryParams.toString()}`
}
