import { Row } from "@tanstack/react-table"
import { Spin } from "antd"

import { TestPlanStatisticPopover } from "entities/test-plan/ui/test-plan-tree-node-view/test-plan-statistic-popover/test-plan-statistic-popover"

import { Status, UntestedStatus } from "shared/ui/status"
import { TreeNode } from "shared/ui/tree"

import styles from "./styles.module.css"

interface Props<T> {
  row: Row<T>
  childStatistics?: Record<string, ChildStatisticData>
}

export const ColumnLastStatus = <T extends TreeNode<Test | TestPlan>>({
  row,
  childStatistics,
}: Props<T>) => {
  if (row.original.data.is_leaf) {
    const rowTest = row as unknown as Row<TreeNode<Test>>

    if (!rowTest.original.data.last_status) {
      return <UntestedStatus />
    }

    return (
      <Status
        id={rowTest.original.data.last_status}
        name={rowTest.original.data.last_status_name}
        color={rowTest.original.data.last_status_color}
      />
    )
  }

  const hasStatistics = childStatistics?.[row.original.id]?.statistics?.length

  if (hasStatistics) {
    return <TestPlanStatisticPopover statistics={childStatistics?.[row.original.id]} />
  } else {
    return <Spin size="small" className={styles.loader} />
  }
}
