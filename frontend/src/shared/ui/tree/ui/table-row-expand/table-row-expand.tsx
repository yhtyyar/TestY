import { Row } from "@tanstack/react-table"
import { useMemo } from "react"

import { TreeArrowIcon } from "shared/ui"

import { useTreeProvider } from "../../tree-provider"
import { TreeNode } from "../../types"
import { createDataTestId } from "../../utils"
import { TableRowPlaceholder } from "../table-row-placeholder/table-row-placeholder"
import styles from "./styles.module.css"

interface Props<T> {
  row: Row<T>
}

export const TableRowExpand = <T extends TreeNode = TreeNode>({ row }: Props<T>) => {
  const { expandIcon, dataTestId, styles: stylesFromCtx } = useTreeProvider()

  const expandIconRender = useMemo(() => {
    if (!expandIcon) {
      return <TreeArrowIcon isOpen={row.getIsExpanded()} style={stylesFromCtx?.expander} />
    }

    return typeof expandIcon === "function" ? expandIcon(row) : expandIcon
  }, [row.getIsExpanded(), expandIcon])

  if (!row.getCanExpand()) {
    return <TableRowPlaceholder />
  }

  return (
    <button
      onClick={() => row.toggleExpanded()}
      type="button"
      aria-label={row.getIsExpanded() ? "Collapse" : "Expand"}
      className={styles.expanderButton}
      data-testid={createDataTestId(dataTestId, `expand-${row.original.title}`)}
    >
      {expandIconRender}
    </button>
  )
}
