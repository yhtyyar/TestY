import { Table } from "@tanstack/react-table"
import { Empty } from "antd"

import { TableCell } from "../table-cell/table-cell"
import { TableBasicRow } from "../table-row/table-basic-row"

interface Props<T> {
  table: Table<T>
}

// eslint-disable-next-line comma-spacing
export const TableEmpty = <T,>({ table }: Props<T>) => {
  return (
    <TableBasicRow>
      <TableCell colSpan={table.options.columns.length}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </TableCell>
    </TableBasicRow>
  )
}
