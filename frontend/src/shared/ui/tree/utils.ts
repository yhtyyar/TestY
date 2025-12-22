import { Column, ColumnSizingState, Row, RowSelectionState } from "@tanstack/react-table"
import { CSSProperties } from "react"

import { BaseNodeEntity, BaseTreeNodeProps, TreeNode } from "./types/types"

interface MakeNodeParams<T extends BaseNodeEntity> {
  title: (item: T) => string
  id?: (item: T) => string
  parent?: ((item: T) => string | null) | string | null
  children?: (item: T) => T[]
}

export const makeTreeNodes = <TData extends BaseNodeEntity, TProps extends BaseTreeNodeProps>(
  data: TData[],
  params: MakeNodeParams<TData>,
  additionalProps?: ((item: TData) => Partial<TProps>) | Partial<TProps>
): TreeNode<TData, TProps>[] => {
  const getAdditionalProps = (item: TData) =>
    additionalProps
      ? typeof additionalProps === "function"
        ? additionalProps(item)
        : additionalProps
      : undefined

  const buildTree = (items: TData[]): TreeNode<TData, TProps>[] =>
    items.map((item) => {
      const id = String(item.id)
      const node: TreeNode<TData, TProps> = {
        id: params.id ? params.id(item) : id,
        data: item,
        title: params.title(item),
        children: buildTree(params.children ? params.children(item) : []),
        parent: typeof params.parent === "function" ? params.parent(item) : (params.parent ?? null),
        // @ts-ignore
        props: {
          ...(getAdditionalProps(item) ?? {}),
        },
      }

      return node
    })

  return buildTree(data)
}

export const arrayOfStringToObject = (array: string[] | number[]) => {
  return array.reduce((acc, id) => ({ ...acc, [String(id)]: true }), {})
}

export const objectToArrayOfString = (object: Record<string, boolean>) => Object.keys(object)

export const createDataTestId = (dataTestId: string | undefined, suffix: string) => {
  return dataTestId ? `${dataTestId}-${suffix}` : undefined
}

export const updateTreeOrderLS = (cacheKey: string, columnOrder: string[]) => {
  window.localStorage.setItem(`${cacheKey}-order`, JSON.stringify(columnOrder))
}

export const getTreeOrderLS = (cacheKey: string, baseColumns: string[]) => {
  const order = window.localStorage.getItem(`${cacheKey}-order`)
  return order ? (JSON.parse(order) as string[]) : baseColumns
}

export const updateTreeSizingLS = (cacheKey: string, columnSizing: ColumnSizingState) => {
  window.localStorage.setItem(`${cacheKey}-sizing`, JSON.stringify(columnSizing))
}

export const getTreeSizingLS = (cacheKey: string) => {
  const order = window.localStorage.getItem(`${cacheKey}-sizing`)
  return order ? (JSON.parse(order) as string[]) : {}
}

export const getCommonPinningStyles = <T>(column: Column<T>): CSSProperties => {
  const isPinned = column.getIsPinned()

  return {
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    zIndex: isPinned ? 1 : 0,
  }
}

interface TreeNodeProps extends BaseTreeNodeProps {
  isLeaf: boolean
  total_count: number | null
}

export const calculateSelectedItems = <TData>(
  flatRows: Row<TreeNode<TData, TreeNodeProps>>[],
  selectedId: RowSelectionState
) => {
  const effectiveStates: Record<string, boolean> = {}
  let totalCount = 0
  const selectedRows: string[] = []
  const selectedLeafRows: string[] = []

  flatRows.forEach((row) => {
    const rowId = row.id
    const parentId = row.parentId

    const countWeight = row.original.props.isLeaf ? 1 : (row.original.props.total_count ?? 0)
    const explicitState = selectedId[rowId]
    const parentIsChecked = parentId && effectiveStates[parentId] === true
    const isChecked = explicitState ?? parentIsChecked

    effectiveStates[rowId] = isChecked

    if (isChecked) {
      if (row.original.props.isLeaf) {
        selectedLeafRows.push(row.id)
      } else {
        selectedRows.push(row.id)
      }
    }

    if (!parentId) {
      if (isChecked) {
        totalCount += countWeight
      }
    } else {
      if (parentIsChecked && !isChecked) {
        totalCount -= countWeight
      } else if (!parentIsChecked && isChecked) {
        totalCount += countWeight
      }
    }
  })

  return {
    selectedRows,
    selectedLeafRows,
    selectedCount: totalCount,
  }
}
