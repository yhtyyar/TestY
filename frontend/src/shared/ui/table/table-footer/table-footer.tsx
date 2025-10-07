import classNames from "classnames"

import styles from "./styles.module.css"

export const TableFooter = ({ className, ...props }: React.ComponentProps<"tfoot">) => {
  return <tfoot className={classNames(styles.tableFooter, className)} {...props} />
}
