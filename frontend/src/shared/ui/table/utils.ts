import { Column, ColumnSizingState, SortingState } from "@tanstack/react-table"
import { CSSProperties } from "react"

export const updateTableOrderLS = (cacheKey: string, columnOrder: string[]) => {
  window.localStorage.setItem(`${cacheKey}-order`, JSON.stringify(columnOrder))
}

export const getTableOrderLS = (cacheKey: string, baseColumns: string[]) => {
  const order = window.localStorage.getItem(`${cacheKey}-order`)
  return order ? (JSON.parse(order) as string[]) : baseColumns
}

export const updateTableSizingLS = (cacheKey: string, columnSizing: ColumnSizingState) => {
  window.localStorage.setItem(`${cacheKey}-sizing`, JSON.stringify(columnSizing))
}

export const getTableSizingLS = (cacheKey: string) => {
  const order = window.localStorage.getItem(`${cacheKey}-sizing`)
  return order ? (JSON.parse(order) as string[]) : {}
}

export const testySortRequestFormat = (columnSorting: SortingState): string | undefined => {
  return columnSorting[0]
    ? !columnSorting[0].desc
      ? columnSorting[0].id
      : `-${columnSorting[0].id}`
    : undefined
}

export const getCommonPinningStyles = <T>(column: Column<T>): CSSProperties => {
  const isPinned = column.getIsPinned()

  return {
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
}
