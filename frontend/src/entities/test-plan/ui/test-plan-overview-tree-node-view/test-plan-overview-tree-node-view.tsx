import { Row } from "@tanstack/react-table"
import classNames from "classnames"
import { useMeContext } from "processes"
import { Link } from "react-router-dom"

import { ArchivedTag } from "shared/ui"
import { TreeNode } from "shared/ui/tree"

import styles from "./styles.module.css"

const getLink = (row: Row<TreeNode<TestPlan>>, projectId: number, userId?: number) => {
  const queryParams = new URLSearchParams(location.search)
  return `/projects/${projectId}/plans/${row.id}?${queryParams.toString()}&assignee=${userId}`
}

interface Props {
  row: Row<TreeNode<TestPlan>>
  projectId: number
  testPlanId?: number | null
}

export const TestPlanTreeOverviewNodeView = ({ row, projectId }: Props) => {
  const data = row.original.data
  const { me } = useMeContext()
  const link = getLink(row, projectId, me?.id)

  return (
    <div
      id={`${row.original.title}-${row.original.id}`}
      key={`${row.original.title}-${row.original.id}-treeview-testplan-overview-asignee-to-me`}
      className={classNames(styles.row, {
        [styles.activeRow]: row.getIsSelected(),
        [styles.isRoot]: row.depth === 0,
      })}
    >
      {data.is_archive && <ArchivedTag />}
      <Link
        to={link}
        className={styles.name}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {data.title}
      </Link>
    </div>
  )
}
