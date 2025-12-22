import { useTreeProvider } from "../../tree-provider"
import { TableBasicRow } from "./table-basic-row"
import { TableHeaderDraggableRow } from "./table-header-draggable-row"

export const TableHeaderRow = (props: React.ComponentProps<"tr">) => {
  const { enableColumnDragging } = useTreeProvider()
  return enableColumnDragging ? (
    <TableHeaderDraggableRow {...props} />
  ) : (
    <TableBasicRow {...props} />
  )
}
