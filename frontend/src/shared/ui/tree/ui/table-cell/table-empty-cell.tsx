import classNames from "classnames"

import { useTreeProvider } from "../../tree-provider"
import styles from "./styles.module.css"

export const TableEmptyCell = (props: React.ComponentProps<"td">) => {
  const { color } = useTreeProvider()

  return <td className={classNames(styles.tableCell, styles[color])} {...props} />
}
