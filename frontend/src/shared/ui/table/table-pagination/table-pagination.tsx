import classNames from "classnames"

import styles from "./styles.module.css"

type Props = React.ComponentProps<"div"> & {
  children: React.ReactNode
}

export const TablePagination = ({ className, children, ...props }: Props) => {
  return (
    <div className={classNames(styles.tablePagination, className)} {...props}>
      {children}
    </div>
  )
}
