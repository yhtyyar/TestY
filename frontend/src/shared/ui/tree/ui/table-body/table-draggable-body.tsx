import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import classNames from "classnames"
import { useMemo } from "react"

import { useTreeProvider } from "../../tree-provider"
import styles from "./styles.module.css"

export const TableDraggableBody = ({ className, ...props }: React.ComponentProps<"tbody">) => {
  const { tree } = useTreeProvider()

  const ids = useMemo(() => {
    return tree.getRowModel().rows.map((row) => row.id)
  }, [tree.getRowModel().rows])

  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      <tbody className={classNames(styles.tbody, className)} {...props} />
    </SortableContext>
  )
}
