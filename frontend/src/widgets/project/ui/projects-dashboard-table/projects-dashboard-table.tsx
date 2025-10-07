import { DataTable } from "widgets"

import { useProjectsDashboardTable } from "widgets/project/model"

interface Props {
  searchName: string
}

export const ProjectsDashboardTable = ({ searchName }: Props) => {
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
      data-testid="projects-dashboard-table"
    />
  )
}
