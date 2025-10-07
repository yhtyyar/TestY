import classNames from "classnames"

import { useTableProvider } from "../table-provider/table-provider"
import styles from "./styles.module.css"
import { TableDraggableBody } from "./table-draggable-body"

export const TableBody = ({ className, ...props }: React.ComponentProps<"tbody">) => {
  const { enableRowDragging } = useTableProvider()

  return enableRowDragging ? (
    <TableDraggableBody {...props} />
  ) : (
    <tbody className={classNames(styles.tbody, className)} {...props} />
  )
}
