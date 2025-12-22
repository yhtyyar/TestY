import {
  Cell,
  ColumnDef,
  ColumnOrderState,
  ColumnSizingState,
  ExpandedState,
  Row,
  RowSelectionState,
  TableOptions,
  TableState,
  Table as TableType,
  Updater,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Virtualizer, useVirtualizer } from "@tanstack/react-virtual"
import {
  CSSProperties,
  DependencyList,
  MutableRefObject,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { LazyTreeFeature, ToggleState } from "./features/lazy-tree-feature"
import { ColorTreeType, LazyTreeNodeParams, LoadChildrenParams, TreeNode } from "./types/types"
import { TableCellSpace } from "./ui"
import { getTreeOrderLS, getTreeSizingLS, updateTreeOrderLS, updateTreeSizingLS } from "./utils"

interface TreeProviderContextType<T> {
  tree: TableType<T>
  data: T[]
  enableRowSelection: TreeProviderProps<T>["enableRowSelection"]
  dataTestId?: string
  expandIcon?: TreeProviderProps<T>["expandIcon"]
  loaderIcon?: TreeProviderProps<T>["loaderIcon"]
  styles?: TreeProviderProps<T>["styles"]
  showSelectionCheckboxes?: TreeProviderProps<T>["showSelectionCheckboxes"]
  enableColumnDragging: TreeProviderProps<T>["enableColumnDragging"]
  enableRowDragging: TreeProviderProps<T>["enableRowDragging"]
  columnOrder: string[]
  headVisible?: TreeProviderProps<T>["headVisible"]
  color: ColorTreeType
  tableContainerRef: React.RefObject<HTMLDivElement>
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>
  autoSelectParentIfAllSelected: boolean
  enableVirtualization: boolean
  onRowClick: TreeProviderProps<T>["onRowClick"]
  updateColumnOrder: (updater: Updater<ColumnOrderState>) => void
  updateColumnSizing: (updater: Updater<ColumnSizingState>) => void
  onRowSelect?: (row: Row<T>) => void
}

export type TreeProviderProps<T> = {
  treeRef?: MutableRefObject<TableType<T> | null>
  onTreeUpdate?: (tree: TableType<T>) => void
  data?: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  getNodeId?: (row: T, index: number, parent?: Row<T> | undefined) => string
  getSubRows?: (row: T) => T[] | undefined
  enableVirtualization?: boolean
  enableRowSelection?: boolean | ((row: Row<T>) => boolean)
  enableMultiRowSelection?: boolean
  enableSubRowSelection?: boolean
  onRowSelect?: (row: Row<T>) => void
  onExpandedChange?: (expanded: ExpandedState) => void
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void
  enableColumnDragging?: boolean
  draggingColumnCacheKey?: string
  resizeColumnCacheKey?: string
  enableRowDragging?: boolean
  headVisible?: boolean
  color?: ColorTreeType
  state?: Partial<TableState> | undefined
  styles?: {
    container?: CSSProperties
    table?: CSSProperties
    row?: CSSProperties | ((row: Row<T>) => CSSProperties)
    cell?: CSSProperties | ((row: Row<T>, cell: Cell<T, unknown>) => CSSProperties)
    cellInner?: CSSProperties | ((row: Row<T>, cell: Cell<T, unknown>) => CSSProperties)
    cellInnerBody?: CSSProperties | ((row: Row<T>, cell: Cell<T, unknown>) => CSSProperties)
    loader?: CSSProperties
    expander?: CSSProperties
    placeholder?: CSSProperties
  }
  className?: string
  expandIcon?: React.ReactNode | ((row: Row<T>) => React.ReactNode)
  loaderIcon?: React.ReactNode | ((row: Row<T>) => React.ReactNode)
  showSelectionCheckboxes?: boolean | ((row: Row<T>) => boolean)
  autoSelectParentIfAllSelected?: boolean
  onRowClick?: (row: Row<T>) => void
  loadChildren?: (
    row: Row<T> | null,
    params: LazyTreeNodeParams
  ) => Promise<{ data: T[]; params: LoadChildrenParams }>
  loadAncestors?: (rowId: Row<T>["id"]) => Promise<number[]>
  autoLoadRoot?: {
    deps: DependencyList
    additionalParams?: Record<string, unknown>
  }
  autoLoadParentsBySelected?: boolean
  autoOpenParentsBySelected?: boolean
  cacheExpandedKey?: string
  children: React.ReactNode
} & Omit<
  TableOptions<T>,
  "getCoreRowModel" | "onExpandedChange" | "onRowSelectionChange" | "state" | "columns" | "data"
> &
  HTMLDataAttribute

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TreeProviderContext = createContext<TreeProviderContextType<any> | null>(null)

export const TreeProvider = <T extends TreeNode = TreeNode>({
  treeRef,
  onTreeUpdate,
  data: _data,
  columns: _columns,
  isLoading: _isLoading = false,
  enableVirtualization = false,
  enableRowSelection = false,
  enableSubRowSelection = true,
  enableMultiRowSelection = true,
  autoSelectParentIfAllSelected = false,
  showSelectionCheckboxes = true,
  getNodeId,
  getSubRows,
  state,
  onExpandedChange: onExpandedChangeProp,
  onRowSelectionChange: onRowSelectionChangeProp,
  onRowSelect,
  onDataChange: _onDataChange,
  children,
  expandIcon,
  loaderIcon,
  styles,
  type = "base",
  color = "tree-linear",
  cacheExpandedKey,
  draggingColumnCacheKey,
  resizeColumnCacheKey,
  enableColumnDragging,
  enableRowDragging,
  headVisible = false,
  autoLoadRoot,
  autoLoadParentsBySelected,
  autoOpenParentsBySelected,
  loadChildren,
  loadAncestors,
  onRowClick,
  ["data-testid"]: dataTestId,
  ...treeOptions
}: TreeProviderProps<T>) => {
  const tableColumnsList = _columns.map((c) => c.id!)
  const columnOrdersState =
    enableColumnDragging && draggingColumnCacheKey
      ? getTreeOrderLS(draggingColumnCacheKey, tableColumnsList)
      : tableColumnsList
  const columnSizeState = resizeColumnCacheKey
    ? getTreeSizingLS(resizeColumnCacheKey)
    : (state?.columnSizing ?? {})

  const [data, setData] = useState<T[]>(_data ?? [])
  const [dataLoading, setDataLoading] = useState<boolean>(_isLoading)
  const [expanded, setExpanded] = useState<ExpandedState>(state?.expanded ?? {})
  const [selected, setSelected] = useState<RowSelectionState>(state?.rowSelection ?? {})
  const [rootPage, setRootPage] = useState<number>(1)
  const [rowLoading, setRowLoading] = useState<ToggleState>()
  const [columnOrder, setColumnOrder] = useState<string[]>(columnOrdersState)
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(columnSizeState)
  const tableContainerRef = useRef(null)

  const onRowSelectionChange = (updater: Updater<RowSelectionState>) => {
    const newRowSelection = typeof updater === "function" ? updater(selected) : updater

    onRowSelectionChangeProp?.(newRowSelection)
    setSelected(newRowSelection)
  }

  const onExpandedChange = (updater: Updater<ExpandedState>) => {
    const newExpanded = typeof updater === "function" ? updater(expanded) : updater

    onExpandedChangeProp?.(newExpanded)
    setExpanded(newExpanded)
  }

  useEffect(() => {
    if (_data) {
      setData(_data)
    }
  }, [_data])

  useEffect(() => {
    setExpanded?.(state?.expanded ?? {})
  }, [state?.expanded])

  useEffect(() => {
    setSelected(state?.rowSelection ?? {})
  }, [state?.rowSelection])

  useEffect(() => {
    setDataLoading(_isLoading)
  }, [_isLoading])

  const onDataChange = useCallback(
    (newData: T[]) => {
      if (_onDataChange) {
        _onDataChange?.(newData)
      } else {
        setData(newData)
      }
    },
    [_onDataChange]
  )

  const columns = useMemo(() => {
    return [
      {
        ..._columns[0],
        cell: (cellValue) => {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const originalCellContent = _columns[0].cell?.(cellValue)

          return (
            <TableCellSpace
              cell={cellValue}
              originalCellContent={originalCellContent as ReactNode}
            />
          )
        },
      },
      ..._columns.slice(1),
    ]
  }, [_columns])

  const tree = useReactTable({
    _features: [LazyTreeFeature],
    data,
    columns,
    enableRowSelection,
    enableMultiRowSelection,
    enableSubRowSelection,
    // @ts-ignore
    getSubRows: (row) => (getSubRows ? getSubRows(row) : (row.children ?? undefined)),
    getRowId: (row, index, parent) => (getNodeId ? getNodeId(row, index, parent) : String(row.id)),
    state: {
      ...state,
      expanded,
      rowSelection: selected,
      dataLoading,
      rowLoading,
      rootPage,
    },
    type,
    cacheExpandedKey,
    enableColumnResizing: false,
    columnResizeMode: "onChange",
    autoLoadRoot,
    autoLoadParentsBySelected,
    autoOpenParentsBySelected,
    loadChildren,
    loadAncestors,
    onRowLoadingChange: setRowLoading,
    onRootPageChange: setRootPage,
    onExpandedChange: onExpandedChange,
    onRowSelectionChange: onRowSelectionChange,
    onDataChange,
    onDataLoadingChange: setDataLoading,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    ...treeOptions,
  })

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: tree.getRowCount(),
    estimateSize: () => 34,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 10,
    enabled: enableVirtualization,
  })

  const updateColumnOrder = (updater: Updater<ColumnOrderState>) => {
    if (typeof updater !== "function") return
    const nextState = updater(columnOrder)
    setColumnOrder(nextState)

    if (enableColumnDragging && draggingColumnCacheKey) {
      updateTreeOrderLS(draggingColumnCacheKey, nextState)
    }
  }

  const updateColumnSizing = (updater: Updater<ColumnSizingState>) => {
    if (typeof updater !== "function") return
    const nextState = updater(columnSizing)
    setColumnSizing(nextState)

    if (resizeColumnCacheKey) {
      updateTreeSizingLS(resizeColumnCacheKey, nextState)
    }
  }

  useEffect(() => {
    if (autoLoadRoot) {
      tree.initRoot()
    }
  }, [...(autoLoadRoot?.deps ?? [])])

  useEffect(() => {
    if (treeRef) {
      treeRef.current = tree
    }
  }, [tree, treeRef])

  useEffect(() => {
    onTreeUpdate?.(tree)
  }, [tree.getRowModel(), onTreeUpdate])

  const providerState: TreeProviderContextType<T> = useMemo(() => {
    return {
      tree,
      data,
      dataTestId,
      enableRowSelection,
      expandIcon,
      loaderIcon,
      styles,
      showSelectionCheckboxes,
      enableColumnDragging,
      enableRowDragging,
      columnOrder,
      headVisible,
      color,
      tableContainerRef,
      rowVirtualizer,
      autoSelectParentIfAllSelected,
      enableVirtualization,
      updateColumnOrder,
      updateColumnSizing,
      onRowClick,
      onRowSelect,
    }
  }, [
    tree,
    data,
    dataTestId,
    enableRowSelection,
    expandIcon,
    loaderIcon,
    styles,
    showSelectionCheckboxes,
    enableColumnDragging,
    enableRowDragging,
    columnOrder,
    headVisible,
    color,
    tableContainerRef,
    rowVirtualizer,
    autoSelectParentIfAllSelected,
    enableVirtualization,
    updateColumnOrder,
    updateColumnSizing,
    onRowClick,
    onRowSelect,
  ])

  return (
    <TreeProviderContext.Provider value={providerState}>{children}</TreeProviderContext.Provider>
  )
}

export const useTreeProvider = () => {
  const context = useContext(TreeProviderContext)
  if (!context) {
    throw new Error("useTreeProvider must be used within TreeProvider")
  }
  return context
}
