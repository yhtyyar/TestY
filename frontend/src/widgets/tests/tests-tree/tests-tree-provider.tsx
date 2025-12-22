import { Row, RowModel, RowSelectionState, Table } from "@tanstack/react-table"
import {
  Dispatch,
  PropsWithChildren,
  RefObject,
  SetStateAction,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { selectFilter, selectOrdering, selectSettings, updateSettings } from "entities/test/model"

import {
  useLazyGetTestPlanAncestorsQuery,
  useLazyGetTestPlansWithTestsQuery,
} from "entities/test-plan/api"

import { useProjectContext } from "pages/project"

import { config } from "shared/config"
import { NOT_ASSIGNED_FILTER_VALUE } from "shared/constants"
import { LazyTreeNodeParams, TreeNode } from "shared/ui/tree"
import { calculateSelectedItems, makeTreeNodes } from "shared/ui/tree/utils"

import { TestsTreeNodeProps } from "./types"

export interface TestsTreeContextType {
  tree: RefObject<Table<TreeNode<Test | TestPlan, TestsTreeNodeProps>>>
  loadChildren: (
    row: Row<TreeNode<Test | TestPlan, TestsTreeNodeProps>> | null,
    params: LazyTreeNodeParams
  ) => Promise<{
    data: TreeNode<Test | TestPlan, TestsTreeNodeProps>[]
    params: {
      page: number
      hasMore: boolean
    }
  }>
  loadAncestors: (rowId: string) => Promise<number[]>
  selectedId: RowSelectionState
  setSelectedId: Dispatch<SetStateAction<RowSelectionState>>
  rowModel?: RowModel<TreeNode<Test | TestPlan, TestsTreeNodeProps>>
  handleTreeUpdate: (instance: Table<TreeNode<Test | TestPlan, TestsTreeNodeProps>>) => void
}

export const TestsTreeContext = createContext<TestsTreeContextType | null>(null)

export const TestsTreeProvider = ({ children }: PropsWithChildren) => {
  const project = useProjectContext()
  const tree = useRef<Table<TreeNode<Test | TestPlan, TestsTreeNodeProps>>>(null)
  const dispatch = useAppDispatch()
  const testsFilter = useAppSelector(selectFilter)
  const testsOrdering = useAppSelector(selectOrdering)
  const treeSettings = useAppSelector(selectSettings<BaseTreeParams>("tree"))
  const [selectedId, setSelectedId] = useState<RowSelectionState>({})

  const [getPlansWithTests] = useLazyGetTestPlansWithTestsQuery()
  const [getAncestors] = useLazyGetTestPlanAncestorsQuery()

  const loadChildren = async (
    row: Row<TreeNode<Test | TestPlan, TestsTreeNodeProps>> | null,
    params: LazyTreeNodeParams
  ) => {
    const res = await getPlansWithTests(
      {
        project: project.id,
        page: params.page,
        parent: params.parent ? Number(params.parent) : null,
        page_size: config.defaultTreePageSize,
        ordering: testsOrdering,
        is_archive: testsFilter.is_archive,
        labels: testsFilter.labels,
        not_labels: testsFilter.not_labels,
        labels_condition: testsFilter.labels_condition,
        last_status: testsFilter.statuses,
        search: testsFilter.name_or_id,
        plan: testsFilter.plans,
        suite: testsFilter.suites,
        assignee: testsFilter.assignee.filter((assignee) => assignee !== NOT_ASSIGNED_FILTER_VALUE),
        unassigned: testsFilter.assignee.includes("null") ? true : undefined,
        test_plan_started_after: testsFilter.test_plan_started_after,
        test_plan_started_before: testsFilter.test_plan_started_before,
        test_plan_created_after: testsFilter.test_plan_created_after,
        test_plan_created_before: testsFilter.test_plan_created_before,
        test_created_after: testsFilter.test_created_after,
        test_created_before: testsFilter.test_created_before,
        level: row?.depth ?? 0,
        _n: params._n,
      },
      true
    ).unwrap()

    const nodes = makeTreeNodes<Test | TestPlan, TestsTreeNodeProps>(
      res.results,
      {
        id: (result) => (result.is_leaf ? `leaf-${result.id}` : result.id.toString()),
        title: (result) => (result.is_leaf ? result.name : result.title),
      },
      (result) => ({
        page: params.page,
        parent: params.parent,
        can_open: result.has_children,
        level: row?.depth ?? 0,
        isLeaf: result.is_leaf,
        total_count: !result.is_leaf ? (result as TestPlan).union_count : null,
        _n: params._n?.toString(),
      })
    )

    return {
      data: nodes,
      params: {
        page: params.page,
        hasMore: !!res.pages.next,
      },
    }
  }

  const loadAncestors = async (rowId: string) => {
    return getAncestors({ project: project.id, id: Number(rowId) }).unwrap()
  }

  const updateTreeSettings = (settings: Partial<TestStateSettings>) => {
    dispatch(updateSettings({ key: "tree", settings }))
  }

  const handleTreeUpdate = useCallback(
    (instance: Table<TreeNode<Test | TestPlan, TestsTreeNodeProps>>) => {
      const { selectedCount, selectedLeafRows, selectedRows } = calculateSelectedItems(
        instance.getRowModel().flatRows,
        selectedId
      )

      updateTreeSettings({
        selectedRows: selectedRows.map(Number),
        selectedLeafRows: selectedLeafRows.map((i) => Number(i.split("leaf-")[1])),
        selectedCount,
      })
    },
    [selectedId]
  )

  useEffect(() => {
    updateTreeSettings({
      selectedRows: [],
      selectedLeafRows: [],
      selectedCount: 0,
      isResetSelection: false,
    })
  }, [])

  useEffect(() => {
    if (treeSettings.isResetSelection) {
      tree.current?.resetRowSelection()
      updateTreeSettings({
        selectedRows: [],
        selectedLeafRows: [],
        selectedCount: 0,
        isResetSelection: false,
      })
    }
  }, [tree, treeSettings.isResetSelection])

  const value = useMemo(() => {
    return {
      tree,
      selectedId,
      loadChildren,
      loadAncestors,
      setSelectedId,
      handleTreeUpdate,
    }
  }, [tree, selectedId, loadChildren, loadAncestors, setSelectedId, handleTreeUpdate])

  return <TestsTreeContext.Provider value={value}>{children}</TestsTreeContext.Provider>
}
