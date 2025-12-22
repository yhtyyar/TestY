import { DataTable } from "widgets"

import { useMyTranslation } from "shared/hooks"

import { useProjectsDashboardTable } from "widgets/project/model"

interface Props {
  searchName: string
}

export const ProjectsDashboardTable = ({ searchName }: Props) => {
  const { t, language } = useMyTranslation(["translation", "common"])
  const {
    isLoading,
    columns,
    data,
    total,
    paginationParams,
    columnSorting,
    setPaginationParams,
    setColumnSorting,
  } = useProjectsDashboardTable({ searchName })

  return (
    <DataTable
      isLoading={isLoading}
      data={data}
      columns={columns}
      rowCount={total}
      onPaginationChange={setPaginationParams}
      onSortingChange={setColumnSorting}
      state={{
        pagination: paginationParams,
        sorting: columnSorting,
      }}
      enableSortingRemoval={false}
      manualPagination
      manualFiltering
      manualSorting
      formatTotalText={(count) => t("common:paginationTotal", { count })}
      lang={language}
      data-testid="projects-dashboard-table"
    />
  )
}
