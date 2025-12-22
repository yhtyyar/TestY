import { Table } from "@tanstack/react-table"

import { TableCell } from "../table-cell/table-cell"
import { TableBasicRow } from "../table-row/table-basic-row"
import placeholder from "./placeholder.svg"
import styles from "./styles.module.css"

interface Props<T> {
  table: Table<T>
  text?: string | null
}

// eslint-disable-next-line comma-spacing
export const TableEmpty = <T,>({ table, text }: Props<T>) => {
  return (
    <TableBasicRow>
      <TableCell colSpan={table.options.columns.length}>
        <div className={styles.emptyBlock}>
          <img src={placeholder} alt="Empty table placeholder" />
          {text && <span className={styles.emptyText}>{text}</span>}
        </div>
      </TableCell>
    </TableBasicRow>
  )
}
