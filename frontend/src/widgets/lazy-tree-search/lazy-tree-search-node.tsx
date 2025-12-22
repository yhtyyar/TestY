import { Row } from "@tanstack/react-table"
import classNames from "classnames"

import { HighLighterTesty } from "shared/ui"
import { BaseTreeNodeProps, TreeNode } from "shared/ui/tree"

import { BaseSearchEntity } from "./lazy-tree-search"
import styles from "./styles.module.css"

interface Props<T extends BaseSearchEntity> {
  node: Row<TreeNode<T, BaseTreeNodeProps>>
  onSelect: (node: Row<TreeNode<T>> | null) => void
  searchText: string
}

export const LazyTreeSearchNode = <T extends BaseSearchEntity>({
  node,
  searchText,
  onSelect,
}: Props<T>) => {
  const handleSelect = () => {
    if (!node.getIsSelected()) {
      node.toggleSelected(true)
      onSelect(node)
    }
  }

  return (
    <div
      id={`${node.original.title}-${node.original.id}`}
      key={`${node.original.title}-${node.original.id}-treeview-suite`}
      className={classNames(styles.row, {
        [styles.activeRow]: node.getIsSelected(),
      })}
      onClick={handleSelect}
    >
      <HighLighterTesty searchWords={searchText} textToHighlight={node.original.title} />
    </div>
  )
}
