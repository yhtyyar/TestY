/* eslint-disable no-extra-semi */
import { ExpandedState, Row, Table, TableFeature, makeStateUpdater } from "@tanstack/react-table"

import { TreeNode } from "../../types/types"
import { objectToArrayOfString } from "../../utils"
import { LazyTreeOptions, LazyTreeState, RowRefetchOptions } from "./types"
import {
  addNodeChildren,
  clearStoreExpandedIds,
  getStoreExpandedIds,
  removeNode,
  setStoreExpandedIds,
  updateNodeChildren,
  updateNodeData,
  updateNodeProps,
} from "./utils"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LazyTreeFeature: TableFeature<any> = {
  getInitialState: (initialState): LazyTreeState => {
    return {
      ...initialState,
      rowLoading: {},
      rowHasMore: {},
      rowMoreLoading: {},
      rowPage: {},
      rowActive: {},
      dataLoading: false,
      rootHasMore: false,
      rootMoreLoading: false,
      rootPage: 1,
    } as LazyTreeState
  },
  getDefaultOptions: <TData extends TreeNode<TData>>(
    table: Table<TData>
  ): LazyTreeOptions<TData> => {
    return {
      type: "lazy",
      onRowLoadingChange: makeStateUpdater("rowLoading", table),
      onRowHasMoreChange: makeStateUpdater("rowHasMore", table),
      onRowMoreLoadingChange: makeStateUpdater("rowMoreLoading", table),
      onRowPageChange: makeStateUpdater("rowPage", table),
      onDataLoadingChange: makeStateUpdater("dataLoading", table),
      onRootPageChange: makeStateUpdater("rootPage", table),
      onRootHasMoreChange: makeStateUpdater("rootHasMore", table),
      onRootMoreLoadingChange: makeStateUpdater("rootMoreLoading", table),
      onRowActiveChange: makeStateUpdater("rowActive", table),
    } as LazyTreeOptions<TData>
  },

  createTable: <TData extends TreeNode<TData>>(table: Table<TreeNode<TData>>): void => {
    const originalToggleAllRowsExpanded = table.toggleAllRowsExpanded?.bind(table)
    const originalTableGetRow = table.getRow?.bind(table)

    table.safeGetRow = (rowId) => {
      try {
        return originalTableGetRow(rowId)
      } catch (err) {
        return undefined
      }
    }

    table.setRowLoading = (rowId: string, value: boolean) => {
      table.options.onRowLoadingChange?.((prevState) => ({
        ...prevState,
        [rowId]: value,
      }))
    }

    table.setRowMoreLoading = (rowId: string, value: boolean) => {
      table.options.onRowMoreLoadingChange?.((prevState) => ({
        ...prevState,
        [rowId]: value,
      }))
    }

    table.setRowHasMore = (rowId: string, value: boolean) => {
      table.options.onRowHasMoreChange?.((prevState) => ({
        ...prevState,
        [rowId]: value,
      }))
    }

    table.setRowPage = (rowId: string, page: number) => {
      table.options.onRowPageChange?.((prevState) => ({
        ...prevState,
        [rowId]: page,
      }))
    }

    table.setRowExpanded = (rowId: string, value: boolean) => {
      table.options.onExpandedChange?.(
        (prevState) =>
          ({
            ...(prevState as Record<string, boolean>),
            [rowId]: value,
          }) as ExpandedState
      )
    }

    table.updateRowChildren = (rowId, newChildren) => {
      table.setOptions((old) => {
        const newData = updateNodeChildren(old.data, rowId, newChildren)
        table.options.onDataChange?.(newData)

        return { ...old, data: newData }
      })
    }

    table.addRowChildren = (rowId, newChildren) => {
      table.setOptions((old) => {
        const newData = addNodeChildren(old.data, rowId, newChildren)
        table.options.onDataChange?.(newData)

        return { ...old, data: newData }
      })
    }

    table.initRoot = async () => {
      try {
        table.options.onRowSelectionChange?.({})
        table.options.onRowLoadingChange?.({})
        table.options.onExpandedChange?.({})
        table.options.onRowPageChange?.({})
        table.options.onDataLoadingChange?.(true)
        const result = await table.options.loadChildren?.(null, {
          page: 1,
          parent: null,
          ...table.options.autoLoadRoot?.additionalParams,
          _n: new Date().getTime(),
        })
        table.setOptions((old) => ({ ...old, data: result?.data ?? [] }))
        table.options.onDataChange?.(result?.data ?? [])

        if (result) {
          table.options.onRootHasMoreChange?.(result.params.hasMore)
        }

        if (table.options.autoLoadParentsBySelected) {
          table.loadActive().finally(() => {
            if (table.options.cacheExpandedKey) {
              table.loadStoredExpanded()
            }
          })
        }
      } catch (error) {
        console.error("Failed to load root data:", error)
      } finally {
        table.options.onDataLoadingChange?.(false)
      }
    }

    table.getCanLoadMore = () => {
      return !!table.getState().rootHasMore
    }

    table.loadMore = async () => {
      try {
        table.options.onRootMoreLoadingChange?.(true)
        const nextPage = (table.getState().rootPage ?? 1) + 1
        const result = await table.options.loadChildren?.(null, {
          page: nextPage,
          parent: null,
          ...table.options.autoLoadRoot?.additionalParams,
          _n: new Date().getTime(),
        })
        table.setOptions((old) => {
          const newData = [...old.data, ...(result?.data ?? [])]
          table.options.onDataChange?.(newData)
          return { ...old, data: newData }
        })

        table.options.onRootPageChange?.(nextPage)
        table.options.onRootHasMoreChange?.(result?.params.hasMore ?? false)

        if (table.options.autoLoadParentsBySelected) {
          table.loadActive().finally(() => {
            if (table.options.cacheExpandedKey) {
              table.loadStoredExpanded()
            }
          })
        }
      } catch (error) {
        console.error("Failed to load more data:", error)
      } finally {
        table.options.onRootMoreLoadingChange?.(false)
      }
    }

    table.loadAncestors = async (rowId, withCurrentRow = false) => {
      const loadedAncestors = await table.options.loadAncestors?.(rowId)
      const ancestorsList = !withCurrentRow
        ? (loadedAncestors ?? [])
        : [...(loadedAncestors ?? []), rowId]

      for await (const ancestor of ancestorsList) {
        const foundRow = table.safeGetRow(ancestor.toString())
        if (!foundRow) {
          continue
        }

        table.setRowLoading(foundRow.id, true)
        const result = await table.options.loadChildren?.(foundRow, {
          ...table.options.autoLoadRoot?.additionalParams,
          page: 1,
          parent: ancestor.toString(),
          _n: new Date().getTime(),
        })

        table.updateRowChildren(ancestor.toString(), result?.data ?? [])

        if (result?.params) {
          table.setRowHasMore(ancestor.toString(), result.params.hasMore)
        }

        table.setRowLoading(foundRow.id, false)
        if (table.options.autoOpenParentsBySelected) {
          table.setRowExpanded(ancestor.toString(), true)
        }
      }
    }

    table.loadActive = async () => {
      try {
        const activedList = objectToArrayOfString(table.getState().rowActive)
        for (const activeId of activedList) {
          const foundActived = table.safeGetRow(activeId)
          if (foundActived) {
            continue
          }
          await table.loadAncestors(activeId)
        }
      } catch (error) {
        console.error("Failed to load child data by ancestors:", error)
      }
    }

    table.loadStoredExpanded = () => {
      if (!table.options.cacheExpandedKey) {
        return
      }
      const storExpandedList = getStoreExpandedIds(table.options.cacheExpandedKey)
      if (!storExpandedList.size) {
        return
      }

      const rowsState = table.getRowModel().rows

      const loadIfNeeded = async (row: Row<TreeNode<TData>>) => {
        table.setRowLoading(row.id, true)
        try {
          const result = await table.options.loadChildren?.(row, {
            page: 1,
            parent: row.id,
            _n: new Date().getTime(),
          })

          table.updateRowChildren(row.id, result?.data ?? [])
          if (result?.params) {
            table.setRowHasMore(row.id, result.params.hasMore)
          }
          table.setExpanded((prevState) => {
            return {
              ...(prevState as Record<string, boolean>),
              [row.id]: true,
            } as ExpandedState
          })
        } catch (err) {
          console.error("Failed to load children:", err)
        } finally {
          table.setRowLoading(row.id, false)
        }
      }

      const walk = async (list: Row<TreeNode<TData>>[]) => {
        for (const r of list) {
          const needsLoad = storExpandedList.has(r.id) && r.subRows.length === 0
          if (!needsLoad) {
            continue
          }

          if (!r.getCanExpand()) {
            continue
          }

          await loadIfNeeded(r)

          const foundRow = table.safeGetRow(r.id)
          const children = foundRow?.subRows ?? []

          if (children.length) {
            await walk(children)
          }
        }
      }

      walk(rowsState)
    }

    table.toggleAllRowsExpanded = (expanded?: boolean) => {
      if (table.options.cacheExpandedKey && !expanded) {
        clearStoreExpandedIds(table.options.cacheExpandedKey)
      }
      return originalToggleAllRowsExpanded?.(expanded)
    }

    table.rowRefetch = async (rowId, predicate = () => true, options) => {
      if (!rowId) {
        await table.initRoot()
      } else {
        const row = table.safeGetRow(rowId)
        if (row && predicate(row)) {
          await row.refetch(options)
          return
        }
        await table.loadAncestors(rowId, true)
      }
    }

    table.cascadeRowsRefetch = async (
      rowIds: string[],
      predicate = () => true,
      options?: RowRefetchOptions
    ) => {
      const refetched: string[] = []
      for (const row of table.getRowModel().rows) {
        if (rowIds.includes(row.id) && predicate(row)) {
          await row.refetch(options)
          refetched.push(row.id)
        }
      }
      return { refetched }
    }

    table.getIsLoadingMore = () => {
      return table.getState().rootMoreLoading ?? false
    }
  },

  createRow: <TData extends TreeNode<TData>>(
    row: Row<TreeNode<TData>>,
    table: Table<TreeNode<TData>>
  ): void => {
    const originalToggleExpanded = row.toggleExpanded?.bind(row)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    row.toggleExpanded = (expanded) => {
      if (
        table.options.type === "lazy" &&
        table.options.loadChildren &&
        !row.getIsExpanded() &&
        row.subRows?.length === 0
      ) {
        ;(async () => {
          try {
            row.toggleLoading(true)
            const result = await table.options.loadChildren?.(row, {
              page: 1,
              parent: row.id,
              _n: new Date().getTime(),
            })

            if (result?.data.length) {
              table.updateRowChildren(row.id, result.data)

              if (row.getIsSelected()) {
                // select children after load
                const newSelected = result.data
                  .map((d) => d.id)
                  .reduce((acc, id) => {
                    // @ts-ignore
                    acc[id] = true
                    return acc
                  }, {})
                table.setRowSelection((prevState) => {
                  return {
                    ...prevState,
                    ...newSelected,
                  }
                })
              }

              if (result?.params) {
                table.setRowHasMore(row.id, result.params.hasMore)
              }
              originalToggleExpanded?.(true)
            }
          } catch (error) {
            console.error("Failed to load children:", error)
            originalToggleExpanded?.(false)
          } finally {
            row.toggleLoading(false)
          }
        })()
      }

      if (table.options.cacheExpandedKey) {
        const currentExpanded = expanded ?? !row.getIsExpanded()
        const expandedFromCache = getStoreExpandedIds(table.options.cacheExpandedKey)
        if (currentExpanded) {
          if (!expandedFromCache.has(row.id)) {
            expandedFromCache.add(row.id)
            setStoreExpandedIds(table.options.cacheExpandedKey, expandedFromCache)
          }
        } else {
          if (expandedFromCache.has(row.id)) {
            expandedFromCache.delete(row.id)
            setStoreExpandedIds(table.options.cacheExpandedKey, expandedFromCache)
          }
        }
      }

      return originalToggleExpanded?.(expanded)
    }

    row.refetch = async (options?: RowRefetchOptions) => {
      try {
        const stateExpanded = row.getIsExpanded()
        table.setRowExpanded(row.id, false)
        table.setRowLoading(row.id, true)
        const result = await table.options.loadChildren?.(row, {
          page: 1,
          parent: row.id,
          _n: new Date().getTime(),
        })

        table.updateRowChildren(row.id, result?.data ?? [])
        if (result?.params) {
          table.setRowHasMore(row.id, result.params.hasMore)
        }
        table.loadActive()
        if (stateExpanded || options?.expand) {
          table.setRowExpanded(row.id, true)
        }
        row.editProps({ can_open: !!result?.data.length }) // TODO мне не нравится что я завязываюсь на этот проп can_open, он может быть любым в теории, либо надо зафиксировать что у Lazy типа он будет обязательным
      } catch (error) {
        console.error("Failed to load children:", error)
      } finally {
        table.setRowLoading(row.id, false)
      }
    }

    row.delete = () => {
      let newData = []
      newData = removeNode(table.options.data, row.id)
      if (row.parentId) {
        const parentRow = table.safeGetRow(row.parentId)
        if (parentRow?.subRows?.length === 1) {
          newData = updateNodeProps(newData, parentRow.id, { can_open: false })
        }
      }

      table.options.onDataChange?.(newData)
    }

    row.editData = (newRowData) => {
      const newData = updateNodeData(table.options.data, row.id, newRowData)
      table.options.onDataChange?.(newData)
    }

    row.editProps = (newProps) => {
      const newData = updateNodeProps(table.options.data, row.id, newProps)
      table.options.onDataChange?.(newData)
    }

    // TODO Ideally, you should remove the refetch and copy only on the client(as edit), but you need to think about where to place it, and for this you need to sort it correctly.
    row.copy = (newRowData) => {
      if (newRowData?.parent) {
        const parentRow = table.safeGetRow(newRowData?.parent?.toString())
        parentRow?.refetch()
      } else {
        table.initRoot()
      }
    }

    row.getIsLoading = () => {
      const state = table.getState()
      return state.rowLoading?.[row.id] ?? false
    }

    row.toggleLoading = (value: boolean) => {
      const state = table.getState()
      const current = state.rowLoading?.[row.id] ?? false
      const newValue = value ?? !current
      table.setRowLoading(row.id, newValue)
    }

    row.getIsLoadingMore = () => {
      return table.getState().rowMoreLoading?.[row.id] ?? false
    }

    row.getCanLoadMore = () => {
      return table.getState().rowHasMore?.[row.id] ?? false
    }

    row.getIsActived = () => {
      return table.getState().rowActive?.[row.id] ?? false
    }

    row.isLast = () => {
      if (!row.parentId) {
        return (
          table.getRowModel().rows.filter((itemRow) => itemRow.depth === 0).length - 1 === row.index
        )
      }
      const foundParentRow = table.safeGetRow(row.parentId)
      if (!foundParentRow) {
        return false
      }
      return foundParentRow.subRows?.length - 1 === row.index
    }

    row.getPage = () => {
      return table.getState().rowPage?.[row.id] ?? 1
    }

    row.loadMore = async () => {
      try {
        row.toggleLoading(true)
        const nextPage = row.getPage() + 1
        const result = await table.options.loadChildren?.(row, {
          page: nextPage,
          parent: row.id,
          _n: new Date().getTime(),
        })
        if (result?.data.length) {
          table.addRowChildren(row.id, result.data)
          originalToggleExpanded?.(true)

          if (row.getIsSelected()) {
            // select children after load
            const newSelected = result.data
              .map((d) => d.id)
              .reduce((acc, id) => {
                // @ts-ignore
                acc[id] = true
                return acc
              }, {})
            table.setRowSelection((prevState) => {
              return {
                ...prevState,
                ...newSelected,
              }
            })
          }
        }
        if (result?.params) {
          table.setRowHasMore(row.id, result.params.hasMore)
          table.setRowPage(row.id, result.params.page)
        }
      } catch (error) {
        console.error("Failed to row loadMore:", error)
        originalToggleExpanded?.(false)
      } finally {
        row.toggleLoading(false)
      }
    }
  },
}
