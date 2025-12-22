import { SortableContext, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Cell } from "@tanstack/react-table"
import classNames from "classnames"
import React, { CSSProperties } from "react"

import { useTreeProvider } from "../../tree-provider"
import { getCommonPinningStyles } from "../../utils"
import styles from "./styles.module.css"

type Props<T> = React.ComponentProps<"td"> & {
  cell: Cell<T, unknown>
}

// eslint-disable-next-line comma-spacing
const TableDraggableCellInner = <T,>({
  className,
  cell,
  style: styleProps,
  ...props
}: Props<T>) => {
  const { enableColumnDragging } = useTreeProvider()

  const { isDragging, setNodeRef, transform } = useSortable({
    id: cell.column.id,
    disabled: !enableColumnDragging,
    data: {
      type: "column",
    },
  })

  const isPinned = cell.column.getIsPinned()
  const isLastLeftPinnedColumn = isPinned === "left" && cell.column.getIsLastColumn("left")
  const isFirstRightPinnedColumn = isPinned === "right" && cell.column.getIsFirstColumn("right")
  const wordBreak = cell.column.columnDef.meta?.wordBreak ?? "break-word"

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition: "width transform 0.1s ease-in-out",
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0,
    wordBreak,
    ...getCommonPinningStyles(cell.column),
    ...styleProps,
  }

  return (
    <td
      ref={setNodeRef}
      className={classNames(
        styles.tableCell,
        {
          [styles.isPinnedLeft]: isLastLeftPinnedColumn,
          [styles.isPinnedRight]: isFirstRightPinnedColumn,
        },
        className
      )}
      {...props}
      style={style}
    />
  )
}

// eslint-disable-next-line comma-spacing
export const TableDraggableCell = <T,>(props: Props<T>) => {
  const { columnOrder } = useTreeProvider()

  return (
    <SortableContext
      key={props.cell.id}
      items={columnOrder}
      strategy={horizontalListSortingStrategy}
    >
      <TableDraggableCellInner {...props} />
    </SortableContext>
  )
}
