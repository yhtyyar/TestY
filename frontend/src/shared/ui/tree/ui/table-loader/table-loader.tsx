import { Spin } from "antd"
import classNames from "classnames"

import styles from "./styles.module.css"

type Props = React.ComponentProps<"div"> & {
  isLoading: boolean
}

export const TableLoader = ({ className, isLoading, ...props }: Props) => {
  if (!isLoading) return null

  return (
    <tr className={styles.tr}>
      <td>
        <div className={classNames(styles.tableLoader, className)} {...props}>
          <Spin />
        </div>
      </td>
    </tr>
  )
}
