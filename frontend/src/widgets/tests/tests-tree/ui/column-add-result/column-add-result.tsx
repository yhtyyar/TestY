import { PlusOutlined } from "@ant-design/icons"
import { Row } from "@tanstack/react-table"
import { Tooltip } from "antd"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { useAppDispatch } from "app/hooks"

import { setDrawerTest, setDrawerView } from "entities/test/model"

import { useProjectContext } from "pages/project"

import { TreeNode } from "shared/ui/tree"

import { getLinkTest } from "../utils"
import styles from "./styles.module.css"

interface Props<T> {
  row: Row<T>
  testPlanId?: number | null
}

export const ColumnAddResult = <T extends TreeNode<Test | TestPlan>>({
  row,
  testPlanId,
}: Props<T>) => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const dispatch = useAppDispatch()
  const link = getLinkTest(row as unknown as Row<TreeNode<Test | TestPlan>>, project.id, testPlanId)

  return (
    <Tooltip title={t("Add Result")}>
      <Link
        to={link}
        className={styles.addResultText}
        onClick={(e) => {
          e.stopPropagation()
          if (row.original.data.is_leaf) {
            dispatch(setDrawerTest(row.original.data as Test))
            dispatch(setDrawerView({ view: "addResult", shouldClose: true }))
          }
        }}
      >
        <PlusOutlined className={styles.addResultIcon} />
        {t("Result")}
      </Link>
    </Tooltip>
  )
}
