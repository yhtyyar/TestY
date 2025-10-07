import { Row, Table, Updater } from "@tanstack/react-table"
import { MutableRefObject, useCallback, useMemo } from "react"

import { arrayNumberToObject, objectToArrayNumber } from "shared/libs/utils"

interface BaseEntity {
  id: number
}

interface Props<T> {
  tableRef: MutableRefObject<Table<T> | null>
  tableSettings: TestTableParams | TestCaseTableParams
  update: (settings: Partial<TestTableParams | TestCaseTableParams>) => void
}

export const useRowSelection = <T extends BaseEntity>({
  tableRef,
  tableSettings,
  update,
}: Props<T>) => {
  const handleToggleSelectAllRows = () => {
    tableRef.current?.toggleAllRowsSelected()
    update({ isAllSelected: !tableSettings.isAllSelected })
  }

  const handleSelectRow = (row: Row<T>) => {
    const { isAllSelected, excludedRows } = tableSettings
    const id = row.original.id

    if (!isAllSelected) {
      row.toggleSelected()
      return
    }

    const isExcluded = excludedRows.includes(id)
    update({
      excludedRows: isExcluded ? excludedRows.filter((exId) => exId !== id) : [...excludedRows, id],
    })
    row.toggleSelected(!isExcluded)
  }

  const resetAll = () => {
    tableRef.current?.resetRowSelection()
    update({ isAllSelected: false, selectedRows: [], excludedRows: [] })
  }

  const rowSelection = useMemo(() => {
    return arrayNumberToObject(tableSettings.selectedRows)
  }, [tableSettings.selectedRows])

  const setRowSelection = useCallback(
    (updater: Updater<Record<string, boolean>>) => {
      if (typeof updater !== "function") return
      const nextState = updater(rowSelection)
      const nextStateArray = objectToArrayNumber(nextState)

      if (!nextStateArray.length) {
        resetAll()
      }

      update({
        selectedRows: !nextStateArray.length ? [] : nextStateArray,
        isAllSelected: !nextStateArray.length ? false : tableSettings.isAllSelected,
      })
    },
    [rowSelection, tableSettings]
  )

  return {
    rowSelection,
    handleSelectRow,
    handleToggleSelectAllRows,
    resetAll,
    setRowSelection,
  }
}
