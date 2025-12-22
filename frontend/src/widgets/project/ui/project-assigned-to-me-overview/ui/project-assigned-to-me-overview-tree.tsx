import { ColumnDef, Row } from "@tanstack/react-table"
import { Flex, Input, Popover, Progress, Tooltip } from "antd"
import { useMeContext } from "processes"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
  useLazyGetTestPlanAncestorsQuery,
  useLazyGetTestPlanAssigneeProgressQuery,
} from "entities/test-plan/api"
import { TestPlanTreeOverviewNodeView } from "entities/test-plan/ui"

import { useProjectContext } from "pages/project"

import SorterIcon from "shared/assets/yi-icons/sort.svg?react"
import { config } from "shared/config"
import { useDebounce } from "shared/hooks"
import { Button, SortBy } from "shared/ui"
import { DataTree, LazyTreeNodeParams, TreeNode } from "shared/ui/tree"
import { makeTreeNodes } from "shared/ui/tree/utils"

const TEST_ID = "assigned-to-me-stats"

export const ProjectAssignedToMeOverviewTree = () => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const { me } = useMeContext()
  const [searchText, setSearchText] = useState("")
  const [ordering, setOrdering] = useState("name")
  const searchDebounce = useDebounce(searchText, 250, true)
  const [getAssigneeProgress] = useLazyGetTestPlanAssigneeProgressQuery()
  const [getAncestors] = useLazyGetTestPlanAncestorsQuery()

  const SORTER_OPTIONS = [
    { value: "name", label: t("Name") },
    { value: "started_at", label: t("Start Date") },
    { value: "created_at", label: t("Created At") },
  ]

  const loadChildren = async (row: Row<TreeNode<TestPlan>> | null, params: LazyTreeNodeParams) => {
    const res = await getAssigneeProgress(
      {
        project: project.id,
        page: params.page,
        parent: params.parent ? Number(params.parent) : null,
        page_size: config.defaultTreePageSize,
        assignee: me?.id ? me.id : undefined,
        treesearch: searchDebounce,
        ordering,
        _n: params._n,
      },
      true
    ).unwrap()

    const nodes = makeTreeNodes(
      res.results,
      {
        title: (result) => result.title,
      },
      {
        parent: params.parent ?? null,
        page: params.page,
        _n: params._n?.toString(),
      }
    )

    return {
      data: nodes,
      params: {
        page: params.page,
        hasMore: !!res.pages.next,
      },
    }
  }

  const loadAncestors = (id: string) => {
    return getAncestors({ project: project.id, id: Number(id) }).unwrap()
  }

  const columns: ColumnDef<TreeNode<TestPlan>>[] = [
    {
      id: "title",
      cell: ({ row }) => <TestPlanTreeOverviewNodeView row={row} projectId={project.id} />,
      meta: {
        responsiveSize: true,
      },
    },
    {
      id: "progress",
      cell: ({ row }) => {
        const testsProgressTotal = row.original.data.tests_progress_total ?? 0
        const totalTests = row.original.data.total_tests ?? 0
        const progressPercent =
          totalTests > 0 ? Math.round((testsProgressTotal / totalTests) * 100) : 0

        return (
          <Flex vertical>
            <Flex justify="space-between">
              <span>
                {testsProgressTotal} / {totalTests}
              </span>
              <span>{progressPercent}%</span>
            </Flex>
            <Progress
              percent={progressPercent}
              status={progressPercent === 100 ? "success" : "normal"}
              showInfo={false}
            />
          </Flex>
        )
      },
    },
  ]

  const styleSizes = { width: 24, height: 24, minWidth: 24 }

  return (
    <div style={{ width: "100%", marginTop: 24 }}>
      <Flex justify="space-between" gap={16} style={{ marginBottom: 8 }}>
        <Input
          placeholder={t("Search")}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          data-testid={`${TEST_ID}-search-input`}
        />
        <Tooltip title={t("Sort")}>
          <Popover
            content={
              <SortBy
                options={SORTER_OPTIONS}
                onChange={setOrdering}
                defaultValue={SORTER_OPTIONS[0].value}
                value={ordering}
                data-testid={`${TEST_ID}-sorter-sort-by-group`}
              />
            }
            arrow={false}
            trigger="click"
            placement="bottomLeft"
          >
            <Button
              style={{ minWidth: 32 }}
              icon={<SorterIcon color="var(--y-color-secondary-inline)" width={18} height={18} />}
              data-testid={`${TEST_ID}-sorter-button`}
              color="secondary-linear"
              shape="square"
            />
          </Popover>
        </Tooltip>
      </Flex>
      <DataTree
        columns={columns}
        type="lazy"
        loadChildren={loadChildren}
        loadAncestors={loadAncestors}
        autoLoadRoot={{
          deps: [searchDebounce, ordering],
        }}
        color="table-linear"
        getRowCanExpand={(row) => row.original.data.has_children}
        styles={{
          placeholder: styleSizes,
          loader: styleSizes,
          expander: styleSizes,
        }}
        data-testid={`${TEST_ID}-tree`}
      />
    </div>
  )
}
