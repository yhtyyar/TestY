import { Row, flexRender } from "@tanstack/react-table"
import { Fragment } from "react/jsx-runtime"

import { useTreeProvider } from "../../tree-provider"
import { TreeNode } from "../../types"
import { createDataTestId } from "../../utils"
import { TableCell } from "../table-cell"
import { TableRowLoadMore } from "../table-row-load-more/table-row-load-more"
import { TableBodyRow } from "./table-body-row"

interface Props<T> {
  rows: Row<T>[]
}

export const TableBodyBasicRows = <T extends TreeNode = TreeNode>({ rows }: Props<T>) => {
  const { tree, onRowClick, dataTestId } = useTreeProvider()

  return rows.map((row) => {
    const parentRow = row.getParentRow()

    return (
      <Fragment key={row.id}>
        <TableBodyRow
          key={`${row.id}-row`}
          row={row as Row<unknown>}
          data-active={tree.getState().rowActiveKey === Number(row.id)}
          data-index={row.index}
          onClick={
            onRowClick
              ? (e) => {
                  e.preventDefault()
                  onRowClick?.(row)
                }
              : undefined
          }
          data-testid={createDataTestId(dataTestId, "tr")}
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell
              key={`${cell.id}-cell`}
              row={row}
              cell={cell}
              data-testid={createDataTestId(dataTestId, `td-${row.original.title}`)}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableBodyRow>
        {parentRow && parentRow.getIsExpanded() && parentRow.getCanLoadMore() && row.isLast() && (
          <TableRowLoadMore row={row.getParentRow()} />
        )}
      </Fragment>
    )
  })
}
