import { SortableContext, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Row } from "@tanstack/react-table"
import classNames from "classnames"
import { CSSProperties } from "react"

import { useTableProvider } from "../table-provider/table-provider"
import styles from "./styles.module.css"

type Props<T> = React.ComponentProps<"tr"> & {
  row?: Row<T>
}

// eslint-disable-next-line comma-spacing
export const TableBodyDraggableRow = <T,>({ className, row, ...props }: Props<T>) => {
  const { columnOrder, enableRowDragging, color } = useTableProvider()

  const { transform, transition, setNodeRef, isDragging, attributes, listeners } = useSortable({
    id: row?.id ?? "",
    disabled: !enableRowDragging,
    data: {
      type: "row",
    },
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative",
  }

  return (
    <tr
      className={classNames(
        styles.tableRow,
        styles[color],
        { [styles.clickable]: props.onClick, [styles.draggable]: enableRowDragging },
        className
      )}
      ref={setNodeRef}
      {...props}
      {...attributes}
      {...listeners}
      style={style}
    >
      <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
        {props.children}
      </SortableContext>
    </tr>
  )
}
