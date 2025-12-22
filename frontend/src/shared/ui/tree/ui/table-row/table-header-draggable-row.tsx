import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { Row } from "@tanstack/react-table"
import classNames from "classnames"

import { useTreeProvider } from "../../tree-provider"
import styles from "./styles.module.css"

type Props<T> = React.ComponentProps<"tr"> & {
  row?: Row<T>
}

// eslint-disable-next-line comma-spacing
export const TableHeaderDraggableRow = <T,>({ className, ...props }: Props<T>) => {
  const { columnOrder } = useTreeProvider()

  return (
    <tr
      className={classNames(styles.tableRow, { [styles.clickable]: props.onClick }, className)}
      {...props}
    >
      <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
        {props.children}
      </SortableContext>
    </tr>
  )
}
