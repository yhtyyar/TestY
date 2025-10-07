import { memo } from "react"
import { DataTable } from "widgets"

import { useTestCasesTable } from "./use-test-cases-table"

export const TestCasesTable = memo(() => {
  const {
    tableRef,
    data,
    columns,
    isLoading,
    selectedTestCase,
    total,
    statePagination,
    columnVisibility,
    rowSelection,
    handleTablePaginationChange,
    handleRowClick,
    setRowSelection,
  } = useTestCasesTable()

  return (
    <DataTable
      tableRef={tableRef}
      isLoading={isLoading}
      data={data}
      columns={columns}
      rowCount={total}
      onRowClick={handleRowClick}
      onPaginationChange={handleTablePaginationChange}
      onRowSelectionChange={setRowSelection}
      state={{
        pagination: statePagination,
        rowActiveKey: selectedTestCase?.id,
        rowSelection,
        columnVisibility,
        columnPinning: {
          left: ["checkbox"],
        },
      }}
      manualPagination
      manualFiltering
      manualSorting
      enableColumnDragging
      draggingColumnCacheKey="test-cases-table"
      resizeColumnCacheKey="test-cases-table"
      data-testid="test-cases-table"
    />
  )
})

TestCasesTable.displayName = "TestCasesTable"
