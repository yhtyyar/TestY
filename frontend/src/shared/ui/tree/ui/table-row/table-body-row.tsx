import { Row } from "@tanstack/react-table"
import { VirtualItem } from "@tanstack/react-virtual"
import { ForwardedRef, forwardRef } from "react"

import { useTreeProvider } from "../../tree-provider"
import { TableBasicRow } from "./table-basic-row"
import { TableBodyDraggableRow } from "./table-body-draggable-row"
import { TableVirtualizeRow } from "./table-virtualize-row"

type Props<T> = React.ComponentProps<"tr"> & {
  row: Row<T>
  virtualRow?: VirtualItem
}

export const TableBodyRow = forwardRef(
  // eslint-disable-next-line comma-spacing
  <T,>({ row, virtualRow, ...props }: Props<T>, ref: ForwardedRef<HTMLTableRowElement>) => {
    const { enableRowDragging, enableVirtualization } = useTreeProvider()

    if (enableRowDragging) {
      return <TableBodyDraggableRow ref={ref} row={row as Row<unknown>} {...props} />
    }

    if (enableVirtualization && virtualRow) {
      return (
        <TableVirtualizeRow
          ref={ref}
          row={row as Row<unknown>}
          virtualRow={virtualRow}
          {...props}
        />
      )
    }

    return <TableBasicRow ref={ref} row={row as Row<unknown>} {...props} />
  }
)

TableBodyRow.displayName = "TableBodyRow"
