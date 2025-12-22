import { Row } from "@tanstack/react-table"
import classNames from "classnames"
import { Link } from "react-router-dom"

import { useAppDispatch } from "app/hooks"

import { setDrawerTest } from "entities/test/model"

import { useProjectContext } from "pages/project"

import { TreeNode } from "shared/ui/tree"

import { TestsTreeNodeProps } from "../../types"
import { getLinkTest } from "../utils"
import styles from "./styles.module.css"

interface Props<T> {
  row: Row<T>
  testPlanId?: number | null
}

export const ColumnName = <T extends TreeNode<Test | TestPlan, TestsTreeNodeProps>>({
  row,
  testPlanId,
}: Props<T>) => {
  const project = useProjectContext()
  const dispatch = useAppDispatch()
  const link = getLinkTest(row as unknown as Row<TreeNode<Test | TestPlan>>, project.id, testPlanId)

  return (
    <Link
      to={link}
      className={classNames(styles.name, {
        [styles.entityName]: !row.original.data.is_leaf,
        [styles.activeLink]: row.getIsSelected(),
      })}
      onClick={(e) => {
        e.stopPropagation()
        if (row.original.data.is_leaf) {
          dispatch(setDrawerTest(row.original.data as Test))
        }
      }}
      data-testid={`${project.id}-tests-tree-${row.original.data.name}`}
    >
      {row.original.title}{" "}
      {row.original.props.total_count !== null ? `(${row.original.props.total_count})` : ""}
    </Link>
  )
}
