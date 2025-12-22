import { ColumnDef } from "@tanstack/react-table"
import dayjs from "dayjs"
import { useContext, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useAppSelector } from "app/hooks"

import { ColumnLabels } from "entities/label/ui"

import {
  selectDrawerTestCase,
  selectFilter,
  selectOrdering,
  selectSettings,
} from "entities/test-case/model"

import { useProjectContext } from "pages/project"

import { DataTree, TreeNode } from "shared/ui/tree"

import { TestCasesTreeContext } from "./test-cases-tree-provider"
import { TestCasesTreeNodeProps } from "./types"
import { ColumnEstimate, ColumnName } from "./ui"

export const TestsCasesTree = () => {
  const { t } = useTranslation()
  const { testSuiteId = null } = useParams<ParamTestSuiteId>()
  const project = useProjectContext()
  const { tree, selectedId, loadAncestors, loadChildren, setSelectedId, handleTreeUpdate } =
    useContext(TestCasesTreeContext)!

  const drawerTestCase = useAppSelector(selectDrawerTestCase)
  const testCasesTreeSettings = useAppSelector(selectSettings<BaseTreeParams>("tree"))
  const testCasesTreeFilter = useAppSelector(selectFilter)
  const testCasesTreeOrdering = useAppSelector(selectOrdering)

  const columns: ColumnDef<TreeNode<TestCase | Suite, TestCasesTreeNodeProps>>[] = useMemo(
    () =>
      (
        [
          {
            id: "name",
            header: () => t("Name"),
            cell: ({ row }) => <ColumnName row={row} testSuiteId={testSuiteId} />,
            meta: {
              responsiveSize: true,
              align: "left",
              wordBreak: "break-all",
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
            id: "labels",
            header: () => t("Labels"),
            cell: ({ row }) => {
              if (!row.original.data.is_leaf) return null
              return <ColumnLabels labels={(row.original.data as Suite).labels} />
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
              align: "right",
            },
          },
        ] as ColumnDef<TreeNode<TestCase | Suite, TestCasesTreeNodeProps>>[]
      ).filter(
        (col) =>
          col.id === "actions" ||
          testCasesTreeSettings.visibleColumns.some((visibleCol) => visibleCol.key === col.id)
      ),
    [project, testSuiteId, testCasesTreeSettings.visibleColumns]
  )

  const spaceStyle = { width: 24, minWidth: 24, height: 24 }
  const activeId = drawerTestCase?.id.toString()

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
        deps: [testSuiteId, testCasesTreeFilter, testCasesTreeOrdering],
        additionalParams: {
          parent: testSuiteId,
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
      cacheExpandedKey={`${project.id}-test-cases-tree`}
      data-testid={`${project.id}-test-cases-tree`}
    />
  )
}
