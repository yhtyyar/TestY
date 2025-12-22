import { Cell, Row } from "@tanstack/react-table"
import classNames from "classnames"

import { useTreeProvider } from "../../tree-provider"
import { getCommonPinningStyles } from "../../utils"
import styles from "./styles.module.css"

type Props<T> = React.ComponentProps<"td"> & {
  row: Row<T>
  cell: Cell<T, unknown>
}

// eslint-disable-next-line comma-spacing
export const TableBasicCell = <T,>({
  className,
  row,
  cell,
  style,
  children,
  ...props
}: Props<T>) => {
  const { color, styles: stylesFromCtx } = useTreeProvider()
  const width = cell.column.columnDef.meta?.fullWidth
    ? "100%"
    : cell.column.columnDef.meta?.responsiveSize
      ? undefined
      : `${cell.column.getSize()}px`
  const align = cell.column.columnDef.meta?.align ?? undefined
  const wordBreak = cell.column.columnDef.meta?.wordBreak ?? "break-word"

  const customStyles =
    typeof stylesFromCtx?.cell === "function" ? stylesFromCtx.cell(row, cell) : stylesFromCtx?.cell

  return (
    <td
      className={classNames(styles.tableCell, styles[color], className)}
      style={{
        width,
        ...getCommonPinningStyles(cell.column),
        ...customStyles,
        ...style,
        wordBreak,
      }}
      {...props}
    >
      <div className={styles.tableCellInner} style={{ justifyContent: align, textAlign: align }}>
        {children}
      </div>
    </td>
  )
}
