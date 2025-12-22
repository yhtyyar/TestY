import { Row } from "@tanstack/react-table"
import classNames from "classnames"
import { Link } from "react-router-dom"

import { useAppDispatch } from "app/hooks"

import { setDrawerTestCase } from "entities/test-case/model"

import { useProjectContext } from "pages/project"

import { TreeNode } from "shared/ui/tree"

import { TestCasesTreeNodeProps } from "../../types"
import { getLinkTestCase } from "../utils"
import styles from "./styles.module.css"

interface Props<T> {
  row: Row<T>
  testSuiteId: string | null
}

export const ColumnName = <T extends TreeNode<TestCase | Suite, TestCasesTreeNodeProps>>({
  row,
  testSuiteId,
}: Props<T>) => {
  const project = useProjectContext()
  const dispatch = useAppDispatch()
  const link = getLinkTestCase(
    row as unknown as Row<TreeNode<TestCase | Suite>>,
    project.id,
    testSuiteId
  )

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
          dispatch(setDrawerTestCase(row.original.data as TestCase))
        }
      }}
      data-testid={`${project.id}-test-cases-tree-${row.original.data.name}`}
    >
      {row.original.data.name}{" "}
      {row.original.props.total_count !== null ? `(${row.original.props.total_count})` : ""}
    </Link>
  )
}
