import { Row, flexRender } from "@tanstack/react-table"
import { Fragment } from "react/jsx-runtime"

import { useTreeProvider } from "../../tree-provider"
import { createDataTestId } from "../../utils"
import { TableCell, TableEmptyCell } from "../table-cell"
import { TableRowLoadMore } from "../table-row-load-more/table-row-load-more"
import { TableRowPlaceholder } from "../table-row-placeholder/table-row-placeholder"
import { TableBodyRow } from "./table-body-row"

interface Props<T> {
  rows: Row<T>[]
}

// eslint-disable-next-line comma-spacing
export const TableBodyVirtualizeRows = <T,>({ rows }: Props<T>) => {
  const { tree, rowVirtualizer, onRowClick, dataTestId } = useTreeProvider()

  return rowVirtualizer.getVirtualItems().map((virtualRow) => {
    const row = rows[virtualRow.index]
    const parentRow = row.getParentRow()

    return (
      <Fragment key={row.id}>
        <TableBodyRow
          key={`${row.id}-row`}
          ref={(node) => rowVirtualizer.measureElement(node)}
          row={row as Row<unknown>}
          virtualRow={virtualRow}
          data-active={tree.getState().rowActiveKey === Number(row.id)}
          data-index={virtualRow.index}
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
              data-testid={createDataTestId(dataTestId, "td")}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableBodyRow>
        {parentRow && parentRow.getIsExpanded() && parentRow.getCanLoadMore() && row.isLast() && (
          <TableBodyRow
            key={`${parentRow.id}-loadmore`}
            row={parentRow as Row<unknown>}
            data-testid={createDataTestId(dataTestId, "tr-loadmore")}
          >
            <TableEmptyCell
              key={`${parentRow.id}-loadmore-cell`}
              data-testid={createDataTestId(dataTestId, "td-loadmore")}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  width: "100%",
                }}
              >
                <TableRowPlaceholder count={row.depth ?? 0} />
                <TableRowLoadMore row={row.getParentRow()} />
              </div>
            </TableEmptyCell>
          </TableBodyRow>
        )}
      </Fragment>
    )
  })
}
