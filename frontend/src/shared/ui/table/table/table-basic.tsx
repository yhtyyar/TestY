import classNames from "classnames"
import React, { forwardRef } from "react"

import styles from "./styles.module.css"

interface TableBasicProps extends Omit<React.ComponentProps<"table">, "ref"> {
  className?: string
  tableContainerClassName?: string
}

export const TableBasic = forwardRef<HTMLDivElement, TableBasicProps>(
  ({ className, tableContainerClassName, ...props }, ref) => {
    return (
      <div className={classNames(styles.tableContainer, tableContainerClassName)}>
        <div className={styles.tableContent} ref={ref}>
          <table className={classNames(styles.table, className)} {...props} />
        </div>
      </div>
    )
  }
)

TableBasic.displayName = "TableBasic"
