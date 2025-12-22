import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { Space } from "antd"
import { useGetIntegrationsQuery } from "entities/integrations/api"
import { DataTable } from "widgets"

import { DeleteIntegrationButton, EditIntegrationButton } from "features/integration"

import { useProjectContext } from "pages/project"

import { MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH } from "shared/constants"
import { useMyTranslation } from "shared/hooks"
import { usePagination } from "shared/ui"

const DATA_TEST_ID = "integrations-table"

const columnHelper = createColumnHelper<IntegrationEntity>()
export const IntegrationsTable = () => {
  const { t, language } = useMyTranslation(["translation", "common"])
  const project = useProjectContext()

  const { pagination, setPagination } = usePagination()

  const { data: integrations, isFetching } = useGetIntegrationsQuery({
    project: project.id,
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
  })

  const columns = [
    columnHelper.accessor("id", {
      id: "id",
      header: t("ID"),
      size: 70,
    }),
    columnHelper.accessor("name", {
      id: "name",
      header: t("Name"),
      enableResizing: true,
      minSize: MIN_COLUMN_WIDTH,
      maxSize: MAX_COLUMN_WIDTH,
      size: 200,
    }),
    columnHelper.accessor("description", {
      id: "description",
      header: t("Description"),
      enableResizing: true,
      minSize: MIN_COLUMN_WIDTH,
      maxSize: MAX_COLUMN_WIDTH,
      size: 200,
    }),
    columnHelper.accessor("service_url", {
      id: "service_url",
      header: t("Service URL"),
      enableResizing: true,
      minSize: MIN_COLUMN_WIDTH,
      maxSize: MAX_COLUMN_WIDTH,
      size: 600,
    }),
    columnHelper.accessor("is_new_tab", {
      id: "is_new_tab",
      header: t("Open in new tab"),
      cell: ({ getValue }) => (getValue() ? t("Yes") : t("No")),
      size: 50,
    }),
    {
      id: "actions",
      header: t("Actions"),
      cell: ({ row }) => (
        <Space>
          <EditIntegrationButton integration={row.original} />
          <DeleteIntegrationButton integration={row.original} />
        </Space>
      ),
      size: 50,
    } as ColumnDef<IntegrationEntity>,
  ]

  return (
    <DataTable
      data={integrations?.results ?? []}
      columns={columns}
      isLoading={isFetching}
      rowCount={integrations?.count ?? 0}
      state={{
        pagination,
      }}
      onPaginationChange={setPagination}
      manualPagination
      formatTotalText={(count) => t("common:paginationTotal", { count })}
      lang={language}
      resizeColumnCacheKey={DATA_TEST_ID}
      data-testid={DATA_TEST_ID}
    />
  )
}
