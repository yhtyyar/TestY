import { Header } from "@tanstack/react-table"

import { useTreeProvider } from "../../tree-provider"
import { TableBasicHead } from "./table-basic-head"
import { TableDraggableHead } from "./table-draggable-head"

type Props<T> = React.ComponentProps<"th"> & {
  header: Header<T, unknown>
}

// eslint-disable-next-line comma-spacing
export const TableHead = <T,>(props: Props<T>) => {
  const { enableColumnDragging } = useTreeProvider()
  if (props.header.column.getIsPinned()) {
    return <TableBasicHead {...props} />
  }

  return enableColumnDragging ? <TableDraggableHead {...props} /> : <TableBasicHead {...props} />
}
