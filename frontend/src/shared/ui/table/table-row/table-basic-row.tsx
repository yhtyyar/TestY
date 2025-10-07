import classNames from "classnames"

import { useTableProvider } from "../table-provider/table-provider"
import styles from "./styles.module.css"

export const TableBasicRow = ({ className, ...props }: React.ComponentProps<"tr">) => {
  const { color } = useTableProvider()
  return (
    <tr
      className={classNames(
        styles.tableRow,
        styles[color],
        { [styles.clickable]: props.onClick },
        className
      )}
      {...props}
    />
  )
}
