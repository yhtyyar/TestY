import classNames from "classnames"

import styles from "./styles.module.css"

export const TableHeader = ({ className, ...props }: React.ComponentProps<"thead">) => {
  return <thead className={classNames(styles.tableHeader, className)} {...props} />
}
