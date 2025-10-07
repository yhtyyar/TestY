import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { Row } from "@tanstack/react-table"
import classNames from "classnames"

import { useTableProvider } from "../table-provider/table-provider"
import styles from "./styles.module.css"

type Props<T> = React.ComponentProps<"tr"> & {
  row?: Row<T>
}

// eslint-disable-next-line comma-spacing
export const TableHeaderDraggableRow = <T,>({ className, ...props }: Props<T>) => {
  const { columnOrder, color } = useTableProvider()

  return (
    <tr
      className={classNames(
        styles.tableRow,
        styles[color],
        { [styles.clickable]: props.onClick },
        className
      )}
      {...props}
    >
      <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
        {props.children}
      </SortableContext>
    </tr>
  )
}
