import { ColumnDef, Row, Table } from "@tanstack/react-table"
import dayjs from "dayjs"
import { useCallback, useContext, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAppSelector } from "app/hooks"

import { ColumnLabels } from "entities/label/ui"

import { selectDrawerTest, selectFilter, selectOrdering, selectSettings } from "entities/test/model"

import { useTestPlanStatisticsContext } from "entities/test-plan/model"

import { useProjectContext } from "pages/project"

import { DataTree, TreeNode } from "shared/ui/tree"

import { TestsTreeContext } from "./tests-tree-provider"
import { TestsTreeNodeProps } from "./types"
import {
  ColumnAddResult,
  ColumnAssigneeUsername,
  ColumnEstimate,
  ColumnLastStatus,
  ColumnName,
  ColumnSuitePath,
} from "./ui"

interface Props {
  testPlanId?: number | null
}

export const TREE_KEY = "tests-tree"

export const TestsTree = ({ testPlanId = null }: Props) => {
  const { t } = useTranslation(["translation", "entities"])
  const project = useProjectContext()
  const { childStatistics, onUpdate } = useTestPlanStatisticsContext()
  const {
    tree,
    selectedId,
    setSelectedId,
    loadChildren,
    loadAncestors,
    handleTreeUpdate: onTreeUpdate,
  } = useContext(TestsTreeContext)!

  const drawerTest = useAppSelector(selectDrawerTest)
  const testsFilter = useAppSelector(selectFilter)
  const testsOrdering = useAppSelector(selectOrdering)
  const testsTreeSettings = useAppSelector(selectSettings<BaseTreeParams>("tree"))

  const columns: ColumnDef<TreeNode<Test | TestPlan, TestsTreeNodeProps>>[] = useMemo(
    () =>
      (
        [
          {
            id: "name",
            header: () => t("Name"),
            cell: ({ row }) => <ColumnName row={row} testPlanId={testPlanId} />,
            meta: {
              responsiveSize: true,
              align: "left",
              wordBreak: "break-all",
            },
          },
          {
            id: "last_status",
            header: () => t("Last status"),
            cell: ({ row }) => {
              return <ColumnLastStatus row={row} childStatistics={childStatistics} />
            },
            meta: {
              responsiveSize: true,
              align: "center",
            },
          },
          {
            id: "id",
            header: () => t("ID"),
            cell: ({ row }) => (
              <span data-testid={`${row.original.data.id}-id`} style={{ textWrap: "nowrap" }}>
                {row.original.data.id}
              </span>
            ),
            meta: {
              responsiveSize: true,
              align: "center",
            },
          },
          {
            id: "suite_path",
            header: () => t("Test Suite"),
            cell: ({ row }) => {
              if (!row.original.data.is_leaf) return null
              return <ColumnSuitePath row={row as Row<TreeNode<Test, TestsTreeNodeProps>>} />
            },
            meta: {
              responsiveSize: true,
              align: "center",
              wordBreak: "break-all",
            },
          },
          {
            id: "assignee_username",
            header: () => t("entities:user.Assignee"),
            cell: ({ row }) => {
              if (!row.original.data.is_leaf) return null
              return <ColumnAssigneeUsername row={row as Row<TreeNode<Test, TestsTreeNodeProps>>} />
            },
            meta: {
              responsiveSize: true,
              align: "left",
            },
          },
          {
            id: "estimate",
            header: () => t("Estimate"),
            cell: ({ row }) => {
              return <ColumnEstimate row={row} />
            },
            meta: {
              responsiveSize: true,
              align: "center",
            },
          },
          {
            id: "labels",
            header: () => t("Labels"),
            cell: ({ row }) => {
              if (!row.original.data.is_leaf) return null
              return <ColumnLabels labels={row.original.data.labels} />
            },
            meta: {
              responsiveSize: true,
              align: "left",
            },
          },
          {
            id: "started_at",
            header: () => t("Start Date"),
            cell: ({ row }) => {
              if (row.original.data.is_leaf) return null
              const rowData = row.original.data as TestPlan
              return (
                <span data-testid={`${rowData.started_at}-started_at`}>
                  {dayjs(rowData.started_at).format("YYYY-MM-DD HH:mm")}
                </span>
              )
            },
            meta: {
              responsiveSize: true,
              align: "center",
            },
          },
          {
            id: "created_at",
            header: () => t("Created At"),
            cell: ({ row }) => {
              return (
                <span data-testid={`${row.original.data.created_at}-created_at`}>
                  {dayjs(row.original.data.created_at).format("YYYY-MM-DD HH:mm")}
                </span>
              )
            },
            meta: {
              responsiveSize: true,
              align: "center",
            },
          },
          {
            id: "actions",
            cell: ({ row }) => {
              if (!row.original.data.is_leaf) return null
              return <ColumnAddResult row={row} testPlanId={testPlanId} />
            },
            meta: {
              responsiveSize: true,
              align: "right",
            },
          },
        ] as ColumnDef<TreeNode<Test | TestPlan, TestsTreeNodeProps>>[]
      ).filter(
        (col) =>
          col.id === "actions" ||
          testsTreeSettings.visibleColumns.some((visibleCol) => visibleCol.key === col.id)
      ),
    [project, testPlanId, childStatistics, testsTreeSettings.visibleColumns]
  )

  const handleTreeUpdate = useCallback(
    (instance: Table<TreeNode<Test | TestPlan, TestsTreeNodeProps>>) => {
      onTreeUpdate(instance)
      onUpdate?.(instance.getRowModel().flatRows)
    },
    [onTreeUpdate]
  )

  const spaceStyle = { width: 24, minWidth: 24, height: 24 }
  const activeId = testPlanId?.toString() ?? drawerTest?.id.toString()

  return (
    <DataTree
      treeRef={tree}
      onTreeUpdate={handleTreeUpdate}
      columns={columns}
      headVisible
      type="lazy"
      color="table-linear"
      state={{ rowSelection: selectedId }}
      loadChildren={loadChildren}
      loadAncestors={loadAncestors}
      autoLoadRoot={{
        deps: [testPlanId, testsFilter, testsOrdering],
        additionalParams: {
          parent: testPlanId,
        },
      }}
      autoLoadParentsBySelected
      autoOpenParentsBySelected
      autoSelectParentIfAllSelected
      getRowCanExpand={(row) => row.original.props?.can_open ?? false}
      onRowSelectionChange={setSelectedId}
      styles={{
        container: { overscrollBehavior: "auto" },
        table: { border: "1px solid var(--y-color-divider)" },
        cell: { padding: 8 },
        row: (row) => {
          const isActive = !activeId ? false : activeId === row.original.id
          return {
            background: isActive ? "var(--y-color-background-alternative)" : "transparent",
          }
        },
        expander: spaceStyle,
        loader: spaceStyle,
        placeholder: spaceStyle,
      }}
      enableRowSelection
      cacheExpandedKey={`${project.id}-tests-tree`}
      data-testid={`${project.id}-tests-tree`}
    />
  )
}
