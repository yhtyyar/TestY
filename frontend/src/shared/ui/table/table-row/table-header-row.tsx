import { useTableProvider } from "../table-provider/table-provider"
import { TableBasicRow } from "./table-basic-row"
import { TableHeaderDraggableRow } from "./table-header-draggable-row"

export const TableHeaderRow = (props: React.ComponentProps<"tr">) => {
  const { enableColumnDragging } = useTableProvider()
  return enableColumnDragging ? (
    <TableHeaderDraggableRow {...props} />
  ) : (
    <TableBasicRow {...props} />
  )
}
