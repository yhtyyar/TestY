import { Cell } from "@tanstack/react-table"
import classNames from "classnames"

import { getCommonPinningStyles } from "../utils"
import styles from "./styles.module.css"

type Props<T> = React.ComponentProps<"td"> & {
  cell?: Cell<T, unknown>
}

// eslint-disable-next-line comma-spacing
export const TableBasicCell = <T,>({ className, cell, style, ...props }: Props<T>) => {
  const width =
    cell && !cell.column.columnDef.meta?.responsiveSize ? `${cell.column.getSize()}px` : undefined

  return (
    <td
      className={classNames(styles.tableCell, className)}
      style={{ width, ...(cell ? getCommonPinningStyles(cell.column) : {}), ...style }}
      {...props}
    />
  )
}
