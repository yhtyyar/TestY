import { Row, RowSelectionState, Table } from "@tanstack/react-table"
import {
  DependencyList,
  Dispatch,
  MutableRefObject,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useLocation, useSearchParams } from "react-router-dom"

import { useDebounce } from "shared/hooks"
import { BaseTreeNodeProps, LazyTreeNodeParams, LoadChildrenParams, TreeNode } from "shared/ui/tree"

import { TreeSettings, getTreeSettingsLS, updateTreeSettingsLS } from "widgets/[ui]/treebar/utils"

import { useTreebarPlan } from "./use-treebar-plan"
import { useTreebarSuite } from "./use-treebar-suite"

interface TreebarProviderContextType {
  treebar: MutableRefObject<Table<TreeNode<Suite | TestPlan>>>
  searchText: string
  treeSettings: TreeSettings
  treebarWidth: number
  setSearchText: Dispatch<SetStateAction<string>>
  updateTreeSettings: (newSettings: Partial<TreeSettings>) => void
  updateTreebarWidth: (width: number) => void
  skipInit: boolean
  initParent: string | null
  selectedId: RowSelectionState
  initDependencies: DependencyList
  activeTab: "suites" | "plans"
  loadChildren: (
    row: Row<TreeNode<Suite | TestPlan>> | null,
    params: LazyTreeNodeParams
  ) => Promise<{
    data: TreeNode<Suite | TestPlan, BaseTreeNodeProps>[]
    params: LoadChildrenParams
  }>
  loadAncestors: (rowId: string) => Promise<number[]>
}

export const TreebarContext = createContext<TreebarProviderContextType | null>(null)
export const MIN_WITH_TREE = 72
export const DEFAULT_WITH_TREE = 374
export const MAX_WITH_TREE_PERCENT = 70
export const MAX_SMALLEST_SIZE = 172

export const TreebarProvider = ({ children }: PropsWithChildren) => {
  const [searchParams] = useSearchParams()
  const location = useLocation()

  const [treeSettings, setTreeSettings] = useState(getTreeSettingsLS())
  const [searchText, setSearchText] = useState(searchParams.get("treeSearch") ?? "")
  const searchDebounce = useDebounce(searchText, 250, true)
  const initParent = searchParams.get("rootId")
  const [treebarWidth, updateTreebarWidth] = useState(
    treeSettings.collapsed ? MIN_WITH_TREE : DEFAULT_WITH_TREE
  )
  const [selectedId, setSelectedId] = useState<RowSelectionState>({})

  const activeTab = useMemo(() => {
    setSearchText("")
    switch (true) {
      case location.pathname.includes("suites"):
        return "suites"
      case location.pathname.includes("plans"):
        return "plans"
      default:
        return "suites"
    }
  }, [location.pathname])

  const {
    treebar: contextSuiteTreebar,
    initDependencies: contextSuiteInitDeps,
    selectedId: contextSuiteSelectedId,
    ...contextSuite
  } = useTreebarSuite({
    treeSettings,
    searchDebounce,
  })
  const {
    treebar: contextPlanTreebar,
    initDependencies: contextPlanInitDeps,
    selectedId: contextPlanSelectedId,
    ...contextPlan
  } = useTreebarPlan({
    treeSettings,
    searchDebounce,
  })

  useEffect(() => {
    const id = contextSuiteSelectedId ?? contextPlanSelectedId
    if (id) {
      setSelectedId({ [id]: true })
    } else {
      setSelectedId({})
    }
  }, [contextSuiteSelectedId, contextPlanSelectedId])

  const updateTreeSettings = (newSettings: Partial<TreeSettings>) => {
    setTreeSettings((prevState) => {
      const settings = { ...prevState, ...newSettings }
      updateTreeSettingsLS(settings)
      return settings
    })
  }

  const contextValue = useMemo(() => {
    const initDeps = activeTab === "suites" ? contextSuiteInitDeps : contextPlanInitDeps
    const baseValue = {
      treebar: activeTab === "suites" ? contextSuiteTreebar : contextPlanTreebar,
      searchText,
      treeSettings,
      initParent,
      treebarWidth,
      updateTreeSettings,
      setSearchText,
      updateTreebarWidth,
      activeTab: activeTab as "suites" | "plans",
    }

    return {
      ...baseValue,
      ...(activeTab === "suites" ? contextSuite : contextPlan),
      initDependencies: [...initDeps, activeTab],
      selectedId,
    } as TreebarProviderContextType
  }, [
    treebarWidth,
    initParent,
    selectedId,
    activeTab,
    contextSuiteTreebar,
    contextPlanTreebar,
    contextSuiteInitDeps,
    contextPlanInitDeps,
    contextSuite,
    contextPlan,
  ])

  if (!activeTab) {
    return null
  }

  return <TreebarContext.Provider value={contextValue}>{children}</TreebarContext.Provider>
}

export const useTreebarProvider = () => {
  const context = useContext(TreebarContext)
  if (!context) {
    throw new Error("useTreebarProvider must be used within TreebarProvider")
  }
  return context
}
