import { Cell } from "@tanstack/react-table"
import { Row } from "@tanstack/react-table"

import { useTreeProvider } from "../../tree-provider"
import { TableBasicCell } from "./table-basic-cell"
import { TableDraggableCell } from "./table-draggable-cell"

type Props<T> = React.ComponentProps<"td"> & {
  row: Row<T>
  cell: Cell<T, unknown>
}

// eslint-disable-next-line comma-spacing
export const TableCell = <T,>({ row, cell, ...props }: Props<T>) => {
  const { enableColumnDragging } = useTreeProvider()
  return enableColumnDragging ? (
    <TableDraggableCell cell={cell} {...props} />
  ) : (
    <TableBasicCell row={row} cell={cell} {...props} />
  )
}
