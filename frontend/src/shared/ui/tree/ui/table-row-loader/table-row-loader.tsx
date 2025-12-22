import { Row } from "@tanstack/react-table"
import { Spin } from "antd"

import { useTreeProvider } from "../../tree-provider"
import { TreeNode } from "../../types"
import { createDataTestId } from "../../utils"
import styles from "./styles.module.css"

interface Props<T> {
  row: Row<T>
}

export const TableRowLoader = <T extends TreeNode = TreeNode>({ row }: Props<T>) => {
  const { dataTestId, loaderIcon, styles: stylesFromCtx } = useTreeProvider()

  if (typeof loaderIcon === "function") {
    return loaderIcon(row)
  } else if (loaderIcon) {
    return loaderIcon
  }

  return (
    <Spin
      size="small"
      className={styles.loader}
      data-testid={createDataTestId(dataTestId, `loader-${row.original.title}`)}
      style={{ width: 16, height: 16, ...stylesFromCtx?.loader }}
    />
  )
}
