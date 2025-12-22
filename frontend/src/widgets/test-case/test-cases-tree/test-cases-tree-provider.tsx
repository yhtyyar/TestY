import { Row, RowSelectionState, Table } from "@tanstack/react-table"
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

import { useLazyGetTestSuitesWithTestCasesQuery } from "entities/suite/api"
import { useLazyGetTestSuiteAncestorsQuery } from "entities/suite/api"

import {
  selectFilter,
  selectOrdering,
  selectSettings,
  updateSettings,
} from "entities/test-case/model"

import { useProjectContext } from "pages/project"

import { config } from "shared/config"
import { LazyTreeNodeParams, TreeNode } from "shared/ui/tree"
import { calculateSelectedItems, makeTreeNodes } from "shared/ui/tree/utils"

import { TestCasesTreeNodeProps } from "./types"

export interface TestCasesTreeContextType {
  tree: RefObject<Table<TreeNode<TestCase | Suite, TestCasesTreeNodeProps>>>
  loadChildren: (
    row: Row<TreeNode<TestCase | Suite, TestCasesTreeNodeProps>> | null,
    params: LazyTreeNodeParams
  ) => Promise<{
    data: TreeNode<TestCase | Suite, TestCasesTreeNodeProps>[]
    params: {
      page: number
      hasMore: boolean
    }
  }>
  loadAncestors: (rowId: string) => Promise<number[]>
  selectedId: RowSelectionState
  setSelectedId: Dispatch<SetStateAction<RowSelectionState>>
  handleTreeUpdate: (instance: Table<TreeNode<TestCase | Suite, TestCasesTreeNodeProps>>) => void
}

export const TestCasesTreeContext = createContext<TestCasesTreeContextType | null>(null)

export const TestCasesTreeProvider = ({ children }: PropsWithChildren) => {
  const project = useProjectContext()
  const dispatch = useAppDispatch()

  const tree = useRef<Table<TreeNode<TestCase | Suite, TestCasesTreeNodeProps>>>(null)

  const treeSettings = useAppSelector(selectSettings<BaseTreeParams>("tree"))
  const testCasesTreeFilter = useAppSelector(selectFilter)
  const testCasesTreeOrdering = useAppSelector(selectOrdering)
  const [selectedId, setSelectedId] = useState<RowSelectionState>({})

  const [getSuiteWithTests] = useLazyGetTestSuitesWithTestCasesQuery()
  const [getAncestors] = useLazyGetTestSuiteAncestorsQuery()

  const loadChildren = async (
    row: Row<TreeNode<TestCase | Suite, TestCasesTreeNodeProps>> | null,
    params: LazyTreeNodeParams
  ) => {
    const res = await getSuiteWithTests({
      project: project.id,
      page: params.page,
      parent: params.parent ? Number(params.parent) : null,
      page_size: config.defaultTreePageSize,
      ordering: testCasesTreeOrdering,
      is_archive: testCasesTreeFilter.is_archive,
      search: testCasesTreeFilter.name_or_id,
      suite: testCasesTreeFilter.suites,
      labels: testCasesTreeFilter.labels,
      not_labels: testCasesTreeFilter.not_labels,
      labels_condition: testCasesTreeFilter.labels_condition,
      test_case_created_after: testCasesTreeFilter.test_case_created_after,
      test_case_created_before: testCasesTreeFilter.test_case_created_before,
      test_suite_created_after: testCasesTreeFilter.test_suite_created_after,
      test_suite_created_before: testCasesTreeFilter.test_suite_created_before,
      level: row?.depth ?? 0,
      _n: params._n,
    }).unwrap()

    const nodes = makeTreeNodes<TestCase | Suite, TestCasesTreeNodeProps>(
      res.results,
      {
        id: (result) => (result.is_leaf ? `leaf-${result.id}` : result.id.toString()),
        title: (result) => result.name,
      },
      (result) => ({
        page: params.page,
        parent: params.parent,
        can_open: result.has_children,
        level: row?.depth ?? 0,
        total_count: !result.is_leaf ? (result as Suite).union_count : null,
        isLeaf: result.is_leaf,
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
    (instance: Table<TreeNode<TestCase | Suite, TestCasesTreeNodeProps>>) => {
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
      loadChildren,
      loadAncestors,
      tree,
      selectedId,
      setSelectedId,
      handleTreeUpdate,
    }
  }, [tree, selectedId, setSelectedId, loadChildren, loadAncestors, handleTreeUpdate])

  return <TestCasesTreeContext.Provider value={value}>{children}</TestCasesTreeContext.Provider>
}
