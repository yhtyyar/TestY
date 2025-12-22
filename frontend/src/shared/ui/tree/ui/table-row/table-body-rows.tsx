import { Row } from "@tanstack/react-table"

import { useTreeProvider } from "../../tree-provider"
import { TreeNode } from "../../types"
import { TableBodyBasicRows } from "./table-body-basic-rows"
import { TableBodyVirtualizeRows } from "./table-body-virtualize-rows"

interface Props<T> {
  rows: Row<T>[]
}

export const TableBodyRows = <T extends TreeNode = TreeNode>({ rows }: Props<T>) => {
  const { enableVirtualization } = useTreeProvider()

  if (enableVirtualization) {
    return <TableBodyVirtualizeRows rows={rows} />
  }

  return <TableBodyBasicRows rows={rows} />
}
