import classNames from "classnames"
import React, { forwardRef } from "react"

import { useTreeProvider } from "../../tree-provider"
import styles from "./styles.module.css"

interface TableBasicProps extends Omit<React.ComponentProps<"table">, "ref"> {
  className?: string
  tableContainerClassName?: string
}

export const TableBasic = forwardRef<HTMLDivElement, TableBasicProps>(
  ({ className, tableContainerClassName, ...props }, ref) => {
    const { color, styles: stylesFromCtx } = useTreeProvider()

    return (
      <div className={classNames(styles.tableContainer, tableContainerClassName)}>
        <div className={styles.tableContent} style={stylesFromCtx?.container} ref={ref}>
          <table
            className={classNames(styles.table, styles[color], className)}
            style={stylesFromCtx?.table}
            {...props}
          />
        </div>
      </div>
    )
  }
)

TableBasic.displayName = "TableBasic"
