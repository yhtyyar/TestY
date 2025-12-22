/* eslint-disable @typescript-eslint/no-explicit-any */
import { OnChangeFn, Row } from "@tanstack/react-table"
import { DependencyList } from "react"

import {
  BaseTreeNodeProps,
  LazyTreeNodeParams,
  LoadChildrenParams,
  TreeNode,
} from "../../types/types"

export type ToggleState = Record<string, boolean>

export interface RowRefetchOptions {
  expand?: boolean
}

export interface LazyTreeState {
  rowActive: ToggleState
  rowLoading?: ToggleState
  rowMoreLoading?: ToggleState
  rowHasMore?: ToggleState
  rowPage?: Record<string, number>
  dataLoading?: boolean
  rootHasMore?: boolean
  rootMoreLoading?: boolean
  rootPage?: number
}

export interface LazyTreeOptions<TData extends TreeNode<TData>> {
  type?: "base" | "lazy"
  autoLoadRoot?: {
    deps: DependencyList
    additionalParams?: Record<string, unknown>
  }
  autoLoadParentsBySelected?: boolean
  autoOpenParentsBySelected?: boolean
  cacheExpandedKey?: string
  loadChildren?: (
    row: Row<TData> | null,
    params: LazyTreeNodeParams
  ) => Promise<{
    data: TData["children"]
    params: LoadChildrenParams
  }>
  loadAncestors?: (rowId: string) => Promise<number[]>
  onRowLoadingChange?: OnChangeFn<ToggleState | undefined>
  onDataChange?: (newData: any[]) => void
  onDataLoadingChange?: (isLoading: boolean) => void
  onRootHasMoreChange?: (hasMore: boolean) => void
  onRootPageChange?: (page: number) => void
  onRootMoreLoadingChange?: (isLoading: boolean) => void
  onRowMoreLoadingChange?: OnChangeFn<ToggleState | undefined>
  onRowHasMoreChange?: OnChangeFn<ToggleState | undefined>
  onRowPageChange?: OnChangeFn<Record<string, number> | undefined>
}

export interface LazyTreeInstance<TData extends TreeNode<TData>> {
  safeGetRow: (rowId: string) => Row<TData> | undefined
  setRowLoading: (rowId: string, toggle: boolean) => void
  setRowExpanded: (rowId: string, toggle: boolean) => void
  setRowMoreLoading: (rowId: string, toggle: boolean) => void
  setRowHasMore: (rowId: string, toggle: boolean) => void
  setRowPage: (rowId: string, page: number) => void
  updateRowChildren: (rowId: string, newChildren: TData["children"]) => void
  addRowChildren: (rowId: string, newChildren: TData["children"]) => void
  initRoot: () => Promise<void>
  loadActive: () => Promise<void>
  loadStoredExpanded: () => Promise<void> | void
  loadAncestors: (rowId: string, withCurrentRow?: boolean) => Promise<void>
  rowRefetch: (
    rowId?: string | null,
    predicate?: (row: Row<TData>) => boolean,
    options?: RowRefetchOptions
  ) => Promise<void>
  cascadeRowsRefetch: (
    rowIds: string[],
    predicate?: (row: Row<TData>) => boolean,
    options?: RowRefetchOptions
  ) => Promise<{ refetched: string[] }>
  getCanLoadMore: () => boolean
  getIsLoadingMore: () => boolean
  loadMore: () => Promise<void>
}

export interface LazyTreeRowModel<TData extends TreeNode<TData>> {
  getIsLoading: () => boolean
  toggleLoading: (value: boolean) => void
  toggleExpanded: (expanded?: boolean) => void | Promise<void>
  updateSubRows: (subRows: any[]) => void
  refetch: (options?: RowRefetchOptions) => Promise<void>
  delete: () => void
  editProps: (newProps: Partial<BaseTreeNodeProps>) => void
  editData: (newData: Partial<TData["data"]>) => void
  copy: (newData?: Omit<Partial<TData>, "id">) => void
  isLast: () => boolean
  getPage: () => number
  loadMore: () => Promise<void>
  getCanLoadMore: () => boolean
  getIsLoadingMore: () => boolean
  getIsActived: () => boolean
}
