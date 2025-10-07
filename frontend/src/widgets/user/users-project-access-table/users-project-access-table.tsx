import { Space } from "antd"
import { useTranslation } from "react-i18next"
import { DataTable } from "widgets"

import { Button } from "shared/ui"

import { useUsersProjectAccessTable } from "./use-users-project-access-table"

interface Props {
  isManageable?: boolean
}

export const UsersProjectAccessTable = ({ isManageable = false }: Props) => {
  const { t } = useTranslation()
  const {
    columns,
    isLoading,
    users,
    total,
    tableRef,
    paginationParams,
    columnFilters,
    setColumnFilters,
    setPaginationParams,
    clearAll,
  } = useUsersProjectAccessTable(isManageable)

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
        data-testid="users-project-access-table"
      />
    </>
  )
}
