import { Row } from "@tanstack/react-table"

import { useTableProvider } from "../table-provider/table-provider"
import { TableBasicRow } from "./table-basic-row"
import { TableBodyDraggableRow } from "./table-body-draggable-row"

type Props<T> = React.ComponentProps<"tr"> & {
  row: Row<T>
}

// eslint-disable-next-line comma-spacing
export const TableBodyRow = <T,>({ row, ...props }: Props<T>) => {
  const { enableColumnDragging, enableRowDragging } = useTableProvider()
  return enableColumnDragging || enableRowDragging ? (
    <TableBodyDraggableRow row={row} {...props} />
  ) : (
    <TableBasicRow {...props} />
  )
}
