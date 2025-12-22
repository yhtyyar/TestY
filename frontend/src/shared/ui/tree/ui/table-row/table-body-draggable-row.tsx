import { SortableContext, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Row } from "@tanstack/react-table"
import classNames from "classnames"
import { CSSProperties, ForwardedRef, forwardRef } from "react"

import { useTreeProvider } from "../../tree-provider"
import styles from "./styles.module.css"

type Props<T> = React.ComponentProps<"tr"> & {
  row?: Row<T>
}

export const TableBodyDraggableRow = forwardRef(
  // eslint-disable-next-line comma-spacing
  <T,>({ row, className, ...props }: Props<T>, ref: ForwardedRef<HTMLTableRowElement>) => {
    const { columnOrder, enableRowDragging, color } = useTreeProvider()

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

    const handleRef = (node: HTMLTableRowElement | null) => {
      setNodeRef(node)
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    return (
      <tr
        className={classNames(
          styles.tableRow,
          styles[color],
          { [styles.clickable]: props.onClick, [styles.draggable]: enableRowDragging },
          className
        )}
        ref={handleRef}
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
)

TableBodyDraggableRow.displayName = "TableBodyDraggableRow"
