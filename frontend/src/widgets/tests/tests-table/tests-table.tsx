import { memo } from "react"
import { DataTable } from "widgets"

import { useTestsTable } from "./use-tests-table"

interface Props {
  testPlanId?: number
}

export const TestsTable = memo(({ testPlanId }: Props) => {
  const {
    tableRef,
    activeTestId,
    data,
    isLoading,
    total,
    columns,
    statePagination,
    rowSelection,
    columnVisibility,
    handleRowClick,
    handleTablePaginationChange,
    setRowSelection,
  } = useTestsTable({ testPlanId: testPlanId ? Number(testPlanId) : null })

  return (
    <DataTable
      tableRef={tableRef}
      key={testPlanId}
      isLoading={isLoading}
      data={data}
      columns={columns}
      rowCount={total}
      onRowClick={handleRowClick}
      onPaginationChange={handleTablePaginationChange}
      onRowSelectionChange={setRowSelection}
      state={{
        pagination: statePagination,
        rowActiveKey: activeTestId,
        rowSelection,
        columnVisibility,
        columnPinning: {
          left: ["checkbox"],
          right: ["actions-column"],
        },
      }}
      manualPagination
      enableColumnDragging
      draggingColumnCacheKey="tests-table"
      resizeColumnCacheKey="tests-table"
      data-testid="tests-table"
    />
  )
})

TestsTable.displayName = "TestsTable"
