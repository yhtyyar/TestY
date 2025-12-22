import { Row, Table } from "@tanstack/react-table"
import { Dropdown, Popover, Tooltip } from "antd"
import classNames from "classnames"
import { useTranslation } from "react-i18next"
import { Link, useSearchParams } from "react-router-dom"

import { TestSuitePopoverInfo } from "entities/suite/ui"

import ExpandIcon from "shared/assets/yi-icons/expand.svg?react"
import InfoIcon from "shared/assets/yi-icons/info.svg?react"
import { createConcatIdsFn } from "shared/libs"
import { ArchivedTag, HighLighterTesty } from "shared/ui"
import { TreeNode } from "shared/ui/tree"

import {
  TestPlanProps,
  TestSuiteProps,
  useTreebarNodeContextMenu,
} from "../use-treebar-node-context-menu"
import { saveUrlParamByKeys } from "../utils"
import styles from "./styles.module.css"

interface Props {
  tree: Table<TreeNode<Suite | TestPlan>>
  row: Row<TreeNode<Suite | TestPlan>>
  type: "suites" | "plans"
  projectId: number
  searchText?: string
  onSelectRow: (nodeId: string) => void
  onRoot: (nodeId: string) => void
}

export const TreebarNodeView = ({
  tree,
  row,
  type,
  projectId,
  searchText,
  onSelectRow,
  onRoot,
}: Props) => {
  const { t } = useTranslation()

  const [searchParams] = useSearchParams()
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const nodeTitle = type === "plans" ? row.original.data.title : row.original.data.name

  const contextItems = useTreebarNodeContextMenu({
    type,
    row,
    projectId,
    tree,
  } as TestPlanProps | TestSuiteProps)

  const handleSelect = () => {
    tree.setState((prevState) => {
      return {
        ...prevState,
        rowActive: {
          [row.id]: true,
        },
      }
    })
    onSelectRow(row.original.id.toString())
  }

  const handleOpenContextMenu = (open: boolean) => {
    tree.setState((prevState) => {
      return {
        ...prevState,
        rowActive: {
          [row.id]: open,
        },
      }
    })
  }

  const urlParams = saveUrlParamByKeys(["rootId", "ordering", "is_archive"], searchParams)

  if (localStorage.getItem("isDrawerPinned") && searchParams.get("test_case")) {
    urlParams.append("test_case", searchParams.get("test_case") ?? "")
  }

  const getIdWithTitle = createConcatIdsFn(nodeTitle as string)

  return (
    <div
      id={`${row.original.title}-${row.original.id}`}
      key={`${row.original.title}-${row.original.id}-treebar`}
      className={classNames(styles.row, {
        [styles.activeRow]: row.getIsActived(),
      })}
      data-testid={getIdWithTitle("treebar-node-view")}
    >
      <Dropdown
        menu={{ items: contextItems }}
        trigger={["contextMenu"]}
        onOpenChange={handleOpenContextMenu}
      >
        <div
          className={styles.rowBody}
          onClick={(e) => {
            e.stopPropagation()
            handleSelect()
          }}
        >
          {type === "plans" && (row.original.data as unknown as TestPlan).is_archive && (
            <ArchivedTag size="sm" data-testid={getIdWithTitle("treebar-archived-tag")} />
          )}
          <Link
            to={{
              pathname: `/projects/${projectId}/${type}/${row.original.id}`,
              search: urlParams.toString(),
            }}
            className={styles.link}
            data-testid={getIdWithTitle("treebar-node-link")}
          >
            <HighLighterTesty
              searchWords={searchText ?? ""}
              textToHighlight={nodeTitle as string}
            />
          </Link>
          {type === "suites" && (
            <Popover
              id={getIdWithTitle("treebar-info-popover")}
              content={
                <TestSuitePopoverInfo
                  cases_count={(row.original.data as unknown as Suite).cases_count}
                  descendant_count={(row.original.data as unknown as Suite).descendant_count}
                  total_cases_count={(row.original.data as unknown as Suite).total_cases_count}
                  estimate={(row.original.data as unknown as Suite).total_estimates}
                />
              }
              placement="right"
            >
              <InfoIcon
                className={styles.infoIcon}
                data-testid={getIdWithTitle("treebar-info-icon")}
                width={16}
                height={16}
              />
            </Popover>
          )}
          {row.original.data.has_children && (
            <Tooltip title={t("Expand")} placement="right">
              <ExpandIcon
                width={16}
                height={16}
                className={styles.expandIcon}
                onClick={(e) => {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  e.stopPropagation()
                  onRoot(row.original.id.toString())
                }}
                data-testid={getIdWithTitle("treebar-expand-button")}
              />
            </Tooltip>
          )}
        </div>
      </Dropdown>
    </div>
  )
}
