import { Cell } from "@tanstack/react-table"

import { useTableProvider } from "../table-provider/table-provider"
import { TableBasicCell } from "./table-basic-cell"
import { TableDraggableCell } from "./table-draggable-cell"

type Props<T> = React.ComponentProps<"td"> & {
  cell?: Cell<T, unknown>
}

// eslint-disable-next-line comma-spacing
export const TableCell = <T,>({ cell, ...props }: Props<T>) => {
  const { enableColumnDragging } = useTableProvider()
  if (!cell) {
    return <TableBasicCell {...props} />
  }

  return enableColumnDragging ? (
    <TableDraggableCell cell={cell} {...props} />
  ) : (
    <TableBasicCell cell={cell} {...props} />
  )
}
