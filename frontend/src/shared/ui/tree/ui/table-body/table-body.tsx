import classNames from "classnames"

import { useTreeProvider } from "../../tree-provider"
import styles from "./styles.module.css"
import { TableDraggableBody } from "./table-draggable-body"

export const TableBody = ({ className, ...props }: React.ComponentProps<"tbody">) => {
  const { enableRowDragging } = useTreeProvider()

  return enableRowDragging ? (
    <TableDraggableBody {...props} />
  ) : (
    <tbody className={classNames(styles.tbody, className)} {...props} />
  )
}
