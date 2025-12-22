import { Row } from "@tanstack/react-table"

import { TreeNode } from "shared/ui/tree"

export const getLinkTestCase = (
  row: Row<TreeNode<TestCase | Suite>>,
  projectId: number,
  testSuiteId: string | null
) => {
  const queryParams = new URLSearchParams(location.search)

  if (!row.original.data.is_leaf) {
    return `/projects/${projectId}/suites/${row.original.data.id}?${queryParams.toString()}`
  }

  queryParams.set("test_case", String(row.original.data.id))
  return `/projects/${projectId}/suites/${testSuiteId ?? (row.original.data as TestCase).suite.id}?${queryParams.toString()}`
}
