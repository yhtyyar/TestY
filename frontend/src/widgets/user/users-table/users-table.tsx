import { Space } from "antd"
import { useTranslation } from "react-i18next"
import { DataTable } from "widgets"

import { Button } from "shared/ui"

import { useUsersTable } from "./use-users-table"

export const UsersTable = () => {
  const { t } = useTranslation()
  const {
    tableRef,
    total,
    columns,
    isLoading,
    users,
    paginationParams,
    columnFilters,
    setColumnFilters,
    setPaginationParams,
    clearAll,
  } = useUsersTable()

  return (
    <>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "right" }}>
        <Button id="clear-filters-and-sorters" onClick={clearAll} color="secondary-linear">
          {t("Clear filters and sorters")}
        </Button>
      </Space>
      <DataTable
        tableRef={tableRef}
        isLoading={isLoading}
        data={users}
        rowCount={total}
        columns={columns}
        onPaginationChange={setPaginationParams}
        onColumnFiltersChange={setColumnFilters}
        state={{
          pagination: paginationParams,
          columnFilters,
        }}
        manualPagination
        manualFiltering
        data-testid="users-table"
      />
    </>
  )
}

export default UsersTable
