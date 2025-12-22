import {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  ExpandedState,
  Row,
  RowModel,
  SortingState,
  TableOptions,
  Table as TableType,
  Updater,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { MAX_COLUMN_WIDTH } from "shared/constants"

import { ColorType, LangType } from "../types"
import {
  getTableOrderLS,
  getTableSizingLS,
  updateTableOrderLS,
  updateTableSizingLS,
} from "../utils"

interface BaseData {
  id: string | number
  subRows?: BaseData[]
}

interface TableProviderContextType<T> {
  table: TableType<T>
  data: T[]
  isLoading: boolean
  enableColumnDragging: boolean
  columnOrder: string[]
  enableRowDragging: boolean
  color: ColorType
  lang: LangType
  updateColumnOrder: Dispatch<SetStateAction<string[]>>
  onDataChange?: (data: T[]) => void
}

export type TableProviderProps<T> = {
  tableRef?: MutableRefObject<TableType<T> | null>
  isLoading?: boolean
  enableColumnDragging?: boolean
  draggingColumnCacheKey?: string
  resizeColumnCacheKey?: string
  enableRowDragging?: boolean
  paginationVisible?: boolean
  tableHeadVisible?: boolean
  tableBodyVisible?: boolean
  paginationSizes?: number[]
  rowBodyClassName?: string | ((row: Row<T>) => string)
  formatTotalText?: (count: number) => string
  emptyText?: string | null
  onRowClick?: (row: Row<T>) => void
  getCoreRowModel?: (table: TableType<T>) => () => RowModel<T>
  onDataChange?: (data: T[]) => void
  color?: ColorType
  lang?: LangType
  children: (table: TableType<T>) => React.ReactNode
} & Omit<TableOptions<T>, "getCoreRowModel"> &
  HTMLDataAttribute

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TableProviderContext = createContext<TableProviderContextType<any> | null>(null)

export const TableProvider = <T extends Partial<BaseData>>({
  tableRef,
  isLoading = false,
  enableColumnDragging = false,
  draggingColumnCacheKey,
  resizeColumnCacheKey,
  enableRowDragging = false,
  children,
  state,
  onDataChange,
  color = "solid",
  lang = "en",
  ...tableOptions
}: TableProviderProps<T>) => {
  const tableColumnsList = tableOptions.columns.map((c) => c.id!)
  const columnOrdersState =
    enableColumnDragging && draggingColumnCacheKey
      ? getTableOrderLS(draggingColumnCacheKey, tableColumnsList)
      : tableColumnsList
  const columnSizeState = resizeColumnCacheKey
    ? getTableSizingLS(resizeColumnCacheKey)
    : (state?.columnSizing ?? {})
  const [columnOrder, setColumnOrder] = useState<string[]>(columnOrdersState)
  const [columnVisibility, setColumnVisibility] = useState(state?.columnVisibility ?? {})
  const [columnPinning, setColumnPinning] = useState(state?.columnPinning ?? {})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(state?.columnFilters ?? [])
  const [columnSorting, setColumnSorting] = useState<SortingState>(state?.sorting ?? [])
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(columnSizeState)
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const updateColumnOrder = (updater: Updater<ColumnOrderState>) => {
    if (typeof updater !== "function") return
    const nextState = updater(columnOrder)
    setColumnOrder(nextState)

    if (enableColumnDragging && draggingColumnCacheKey) {
      updateTableOrderLS(draggingColumnCacheKey, nextState)
    }
  }

  const updateColumnSizing = (updater: Updater<ColumnSizingState>) => {
    if (typeof updater !== "function") return
    const nextState = updater(columnSizing)
    setColumnSizing(nextState)

    if (resizeColumnCacheKey) {
      updateTableSizingLS(resizeColumnCacheKey, nextState)
    }
  }

  const table = useReactTable({
    defaultColumn: {
      maxSize: MAX_COLUMN_WIDTH,
      enableResizing: false,
    },
    getPaginationRowModel: tableOptions.manualPagination ? undefined : getPaginationRowModel(),
    getCoreRowModel: tableOptions.getCoreRowModel ?? getCoreRowModel(),
    onColumnOrderChange: enableColumnDragging ? updateColumnOrder : undefined,
    getFilteredRowModel: tableOptions.manualFiltering ? undefined : getFilteredRowModel(),
    getSortedRowModel: tableOptions.manualSorting ? undefined : getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setColumnSorting,
    onColumnSizingChange: updateColumnSizing,
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (row, index) => (row?.id ? row.id.toString() : String(index)),
    state: {
      columnVisibility,
      columnPinning,
      columnOrder: enableColumnDragging ? columnOrder : undefined,
      columnFilters,
      sorting: columnSorting,
      columnSizing,
      expanded,
      ...state,
    },
    enableRowSelection: true,
    columnResizeMode: "onChange",
    ...tableOptions,
  })

  useEffect(() => {
    if (table && tableRef) {
      tableRef.current = table
    }
  }, [table, tableRef])

  const providerState = useMemo(() => {
    return {
      table,
      data: tableOptions.data,
      isLoading,
      enableColumnDragging,
      columnOrder,
      enableRowDragging,
      color,
      lang,
      updateColumnOrder,
      onDataChange,
    }
  }, [
    tableOptions.data,
    isLoading,
    enableColumnDragging,
    columnOrder,
    enableRowDragging,
    color,
    lang,
    updateColumnOrder,
    onDataChange,
  ])

  return (
    <TableProviderContext.Provider value={providerState}>
      {children(table)}
    </TableProviderContext.Provider>
  )
}

export const useTableProvider = () => {
  const context = useContext(TableProviderContext)
  if (!context) {
    throw new Error("useTableProvider must be used within TableProvider")
  }
  return context
}
