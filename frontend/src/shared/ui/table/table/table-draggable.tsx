import {
  DndContext,
  DragEndEvent,
  Modifier,
  MouseSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToHorizontalAxis, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { arrayMove } from "@dnd-kit/sortable"
import classNames from "classnames"
import React, { forwardRef, useMemo } from "react"

import { useTableProvider } from "../table-provider/table-provider"
import styles from "./styles.module.css"

interface TableDraggableProps extends Omit<React.ComponentProps<"table">, "ref"> {
  className?: string
  tableContainerClassName?: string
}

export const TableDraggable = forwardRef<HTMLDivElement, TableDraggableProps>(
  ({ className, tableContainerClassName, ...props }, ref) => {
    const { updateColumnOrder, data, onDataChange } = useTableProvider()

    const dataIds = useMemo(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return data.map((i) => String(i.id))
    }, [data])

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event
      if (!active || !over || active.id === over.id) return

      const isColumnDrag = active.data.current?.type === "column"
      const isRowDrag = active.data.current?.type === "row"

      if (isColumnDrag) {
        updateColumnOrder((columns) => {
          const oldIndex = columns.indexOf(active.id as string)
          const newIndex = columns.indexOf(over.id as string)
          return arrayMove(columns, oldIndex, newIndex)
        })
      }

      if (isRowDrag) {
        const oldIndex = dataIds.indexOf(String(active.id))
        const newIndex = dataIds.indexOf(String(over.id))
        onDataChange?.(arrayMove(data, oldIndex, newIndex))
      }
    }

    const sensors = useSensors(
      useSensor(MouseSensor, {
        activationConstraint: {
          distance: 5,
        },
      })
    )

    const modifiers: Modifier[] = [
      (args) => {
        const dragType = args.active?.data.current?.type as "row" | "column"

        if (dragType === "column") {
          return restrictToHorizontalAxis(args)
        } else {
          return restrictToVerticalAxis(args)
        }
      },
    ]

    return (
      <DndContext
        collisionDetection={closestCenter}
        modifiers={modifiers}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <div className={classNames(styles.tableContainer, tableContainerClassName)}>
          <div className={styles.tableContent} ref={ref}>
            <table className={classNames(styles.table, className)} {...props} />
          </div>
        </div>
      </DndContext>
    )
  }
)

TableDraggable.displayName = "TableDraggable"
