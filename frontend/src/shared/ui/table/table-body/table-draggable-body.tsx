import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import classNames from "classnames"
import { useMemo } from "react"

import { useTableProvider } from "../table-provider/table-provider"
import styles from "./styles.module.css"

export const TableDraggableBody = ({ className, ...props }: React.ComponentProps<"tbody">) => {
  const { table } = useTableProvider()

  const ids = useMemo(() => {
    return table.getRowModel().rows.map((row) => row.id)
  }, [table.getRowModel().rows])

  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      <tbody className={classNames(styles.tbody, className)} {...props} />
    </SortableContext>
  )
}
