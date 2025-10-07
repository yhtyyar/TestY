import { ColumnDef, Table, createColumnHelper } from "@tanstack/react-table"
import { Flex, Space } from "antd"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { DataTable } from "widgets"

import { useGetLabelsQuery } from "entities/label/api"
import { getLabelTypeTextByNumber } from "entities/label/lib"

import { DeleteLabelButton, EditLabelButton } from "features/label"

import { useProjectContext } from "pages/project"

import { Button } from "shared/ui"
import { TableFilterSearch, TableFilterSelect, TableSorting } from "shared/ui"

const columnHelper = createColumnHelper<Label>()
export const LabelsTable = () => {
  const { t } = useTranslation()
  const project = useProjectContext()

  const { data: labels = [], isFetching } = useGetLabelsQuery({ project: project.id.toString() })

  const tableRef = useRef<Table<Label> | null>(null)
  const columns = [
    columnHelper.accessor("id", {
      id: "id",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("ID")}</span>
          <Flex align="center" gap={4}>
            <TableSorting column={column} />
            <TableFilterSearch column={column} />
          </Flex>
        </Flex>
      ),
      size: 70,
      meta: {
        useInDataTestId: true,
      },
    }),
    columnHelper.accessor("name", {
      id: "name",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Name")}</span>
          <Flex align="center" gap={4}>
            <TableSorting column={column} />
            <TableFilterSearch column={column} />
          </Flex>
        </Flex>
      ),
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("type", {
      id: "type",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Type")}</span>
          <TableFilterSelect
            column={column}
            options={[
              { label: "System", key: "system", value: 0 },
              { label: "Custom", key: "custom", value: 1 },
            ]}
          />
        </Flex>
      ),
      filterFn: (row, _, filterValue: number[]) => {
        if (!filterValue || filterValue.length === 0) return true
        return filterValue.includes(row.getValue("type"))
      },
      cell: ({ getValue }) => {
        return getLabelTypeTextByNumber(getValue())
      },
      meta: {
        responsiveSize: true,
      },
    }),
    {
      id: "actions",
      header: t("Actions"),
      cell: ({ row }) => (
        <Space>
          <EditLabelButton label={row.original} />
          <DeleteLabelButton label={row.original} />
        </Space>
      ),
      size: 100,
    } as ColumnDef<Label>,
  ]

  const clearAll = () => {
    tableRef.current?.resetColumnFilters()
    tableRef.current?.resetSorting()
  }

  return (
    <>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "right" }}>
        <Button id="clear-filters-and-sorters" onClick={clearAll} color="secondary-linear">
          {t("Clear filters and sorters")}
        </Button>
      </Space>
      <DataTable
        tableRef={tableRef}
        data={labels}
        columns={columns}
        isLoading={isFetching}
        data-testid="labels-table"
      />
    </>
  )
}
