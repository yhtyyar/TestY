import { CellContext } from "@tanstack/react-table"
import classNames from "classnames"
import { CSSProperties } from "react"

import { useTreeProvider } from "../../tree-provider"
import { TreeNode } from "../../types/types"
import { TableRowCheckbox } from "../table-row-checkbox/table-row-checkbox"
import { TableRowExpand } from "../table-row-expand/table-row-expand"
import { TableRowLoader } from "../table-row-loader/table-row-loader"
import { TableRowPlaceholder } from "../table-row-placeholder/table-row-placeholder"
import styles from "./styles.module.css"

interface Props<T> {
  cell: CellContext<T, unknown>
  originalCellContent: React.ReactNode
}

export const TableCellSpace = <T extends TreeNode = TreeNode>({
  cell,
  originalCellContent,
}: Props<T>) => {
  const {
    color,
    enableRowSelection,
    showSelectionCheckboxes,
    styles: stylesFromCtx,
  } = useTreeProvider()
  const isShowSelectionCheckboxes =
    typeof showSelectionCheckboxes === "function"
      ? showSelectionCheckboxes(cell.row)
      : showSelectionCheckboxes

  const baseCellInnerStyles: CSSProperties =
    color === "tree-linear"
      ? {
          borderBottom: "1px solid var(--y-color-border)",
          borderLeft: cell.row.depth === 0 ? "none" : "1px solid var(--y-color-border)",
        }
      : {}

  return (
    <div
      className={styles.tableCellInner}
      style={
        typeof stylesFromCtx?.cellInner === "function"
          ? stylesFromCtx.cellInner(cell.row, cell.cell)
          : stylesFromCtx?.cellInner
      }
    >
      <TableRowPlaceholder count={cell.row.depth ?? 0} />
      <div
        className={classNames(styles.tableCellInnerBody, styles[color])}
        style={{
          ...baseCellInnerStyles,
          ...(typeof stylesFromCtx?.cellInnerBody === "function"
            ? stylesFromCtx.cellInnerBody(cell.row, cell.cell)
            : (stylesFromCtx?.cellInnerBody ?? {})),
        }}
      >
        {cell.row.getIsLoading() ? (
          <TableRowLoader row={cell.row} />
        ) : (
          <TableRowExpand row={cell.row} />
        )}
        {enableRowSelection && isShowSelectionCheckboxes && <TableRowCheckbox row={cell.row} />}
        {originalCellContent}
      </div>
    </div>
  )
}
