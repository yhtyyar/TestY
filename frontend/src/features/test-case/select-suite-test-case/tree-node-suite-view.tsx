import { Row } from "@tanstack/react-table"
import classNames from "classnames"

import { TreeNode } from "shared/ui/tree"

import styles from "./styles.module.css"

interface Props {
  row: Row<TreeNode<Suite>>
  onSelectRow: (row: Row<TreeNode<Suite>>) => void
}

export const TreeNodeSuiteView = ({ row, onSelectRow }: Props) => {
  const handleSelect = () => {
    if (!row.getIsSelected()) {
      row.toggleSelected(true)
      onSelectRow(row)
    }
  }

  return (
    <div
      id={`${row.original.title}-${row.original.id}`}
      key={`${row.original.title}-${row.original.id}-treeview-suite`}
      className={classNames(styles.row, {
        [styles.activeRow]: row.getIsSelected(),
      })}
      onClick={handleSelect}
    >
      <span className={styles.name}>{row.original.data.name}</span>
    </div>
  )
}
