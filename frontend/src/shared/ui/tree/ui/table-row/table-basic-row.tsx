import { Row } from "@tanstack/react-table"
import classNames from "classnames"
import { ForwardedRef, forwardRef } from "react"

import { useTreeProvider } from "../../tree-provider"
import styles from "./styles.module.css"

type Props<T> = React.ComponentProps<"tr"> & {
  row?: Row<T>
}

export const TableBasicRow = forwardRef(
  // eslint-disable-next-line comma-spacing
  <T,>({ className, style, row, ...props }: Props<T>, ref: ForwardedRef<HTMLTableRowElement>) => {
    const { color, styles: stylesFromCtx } = useTreeProvider()

    const customStyles = row
      ? typeof stylesFromCtx?.row === "function"
        ? stylesFromCtx.row(row)
        : stylesFromCtx?.row
      : {}

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
          ...customStyles,
          ...style,
        }}
        {...props}
      />
    )
  }
)

TableBasicRow.displayName = "TableBasicRow"
