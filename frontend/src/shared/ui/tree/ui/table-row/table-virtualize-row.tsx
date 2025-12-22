import { Row } from "@tanstack/react-table"
import { VirtualItem } from "@tanstack/react-virtual"
import classNames from "classnames"
import { ForwardedRef, forwardRef } from "react"

import { useTreeProvider } from "../../tree-provider"
import styles from "./styles.module.css"

type Props<T> = React.ComponentProps<"tr"> & {
  row: Row<T>
  virtualRow: VirtualItem
}

export const TableVirtualizeRow = forwardRef(
  // eslint-disable-next-line comma-spacing
  <T,>(
    { className, virtualRow, row, style, ...props }: Props<T>,
    ref: ForwardedRef<HTMLTableRowElement>
  ) => {
    const { color, styles: stylesFromCtx } = useTreeProvider()

    const customStyles =
      typeof stylesFromCtx?.row === "function" ? stylesFromCtx.row(row) : stylesFromCtx?.row

    return (
      <tr
        ref={ref}
        className={classNames(
          styles.tableRow,
          styles[color],
          { [styles.clickable]: props.onClick },
          className
        )}
        style={{
          display: "flex",
          position: "absolute",
          transform: `translateY(${virtualRow.start}px)`,
          width: "100%",
          ...customStyles,
          ...style,
        }}
        {...props}
      />
    )
  }
)

TableVirtualizeRow.displayName = "TableVirtualizeRow"
