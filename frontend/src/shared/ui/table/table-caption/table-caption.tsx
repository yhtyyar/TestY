import classNames from "classnames"

import styles from "./styles.module.css"

export const TableCaption = ({ className, ...props }: React.ComponentProps<"caption">) => {
  return <caption className={classNames(styles.tableCaption, className)} {...props} />
}
