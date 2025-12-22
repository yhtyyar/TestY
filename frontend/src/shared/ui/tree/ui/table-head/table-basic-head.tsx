import { Header } from "@tanstack/react-table"
import classNames from "classnames"

import { getCommonPinningStyles } from "../../utils"
import { ColumnResizeIndicator } from "../column-resize-indicator/column-resize-indicator"
import styles from "./styles.module.css"

type Props<T> = React.ComponentProps<"th"> & {
  header: Header<T, unknown>
}

// eslint-disable-next-line comma-spacing
export const TableBasicHead = <T,>({ className, children, header, style, ...props }: Props<T>) => {
  const width = header.column.columnDef.meta?.fullWidth
    ? "100%"
    : header.column.columnDef.meta?.responsiveSize
      ? undefined
      : `${header.getSize()}px`
  const isPinned = header.column.getIsPinned()
  const isLastLeftPinnedColumn = isPinned === "left" && header.column.getIsLastColumn("left")
  const isFirstRightPinnedColumn = isPinned === "right" && header.column.getIsFirstColumn("right")
  const align = header.column.columnDef.meta?.align ?? undefined

  return (
    <th
      className={classNames(
        styles.tableHead,
        {
          [styles.isPinnedLeft]: isLastLeftPinnedColumn,
          [styles.isPinnedRight]: isFirstRightPinnedColumn,
        },
        className
      )}
      style={{
        flex: "1 1 auto",
        width,
        ...getCommonPinningStyles(header.column),
        ...style,
      }}
      {...props}
    >
      <div className={styles.thContent} style={{ justifyContent: align }}>
        {children}
        {header.column.getCanResize() && (
          <ColumnResizeIndicator onMouseDown={header.getResizeHandler()} />
        )}
      </div>
    </th>
  )
}
