import { ColumnDef, Table, createColumnHelper } from "@tanstack/react-table"
import { Flex, Space } from "antd"
import { useGetCustomAttributesQuery } from "entities/custom-attribute/api"
import { useRef } from "react"
import { DataTable } from "widgets"

import { ChangeCustomAttribute, DeleteCustomAttribute } from "features/custom-attribute"

import { useProjectContext } from "pages/project"

import { customAttributeTypes, customAttributesObject } from "shared/config/custom-attribute-types"
import { useMyTranslation } from "shared/hooks"
import { Button, TableFilterSearch, TableFilterSelect, TableSorting } from "shared/ui"

const columnHelper = createColumnHelper<CustomAttribute>()
export const CustomAttributesTable = () => {
  const { t, language } = useMyTranslation(["translation", "common"])
  const project = useProjectContext()

  const { data = [], isFetching } = useGetCustomAttributesQuery({ project: project.id.toString() })

  const tableRef = useRef<Table<CustomAttribute> | null>(null)

  const clearAll = () => {
    tableRef.current?.resetColumnFilters()
    tableRef.current?.resetSorting()
  }

  const columns = [
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
        useInDataTestId: true,
      },
    }),
    columnHelper.accessor("type", {
      id: "type",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Type")}</span>
          <TableFilterSelect
            column={column}
            options={customAttributeTypes.map((i) => ({
              label: i.label,
              key: i.label,
              value: i.value,
            }))}
          />
        </Flex>
      ),
      filterFn: (row, _, filterValue: number[]) => {
        if (!filterValue || filterValue.length === 0) return true
        return filterValue.includes(row.getValue("type"))
      },
      cell: ({ getValue }) => <Space>{customAttributesObject[getValue()]}</Space>,
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("applied_to", {
      id: "applied_to",
      header: t("Applied To"),
      cell: ({ getValue }) => <Space>{Object.keys(getValue()).join(", ")}</Space>,
      meta: {
        responsiveSize: true,
      },
    }),
    {
      id: "actions",
      header: t("Actions"),
      cell: ({ row }) => (
        <Space>
          <ChangeCustomAttribute formType="edit" attribute={row.original} />
          <DeleteCustomAttribute attributeId={row.original.id} />
        </Space>
      ),
      size: 100,
    } as ColumnDef<CustomAttribute>,
  ]

  return (
    <>
      <Space style={{ marginBottom: 16, display: "flex", justifyContent: "right" }}>
        <Button id="clear-filters-and-sorters" onClick={clearAll} color="secondary-linear">
          {t("Clear filters and sorters")}
        </Button>
      </Space>
      <DataTable
        tableRef={tableRef}
        isLoading={isFetching}
        data={data}
        columns={columns}
        formatTotalText={(count) => t("common:paginationTotal", { count })}
        lang={language}
        data-testid="custom-attributes-table"
      />
    </>
  )
}
