import { CellContext, ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { Flex, Space } from "antd"
import { useGetStatusesQuery } from "entities/status/api"
import { getStatusTypeTextByNumber } from "entities/status/lib"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { DataTable } from "widgets"

import { DeleteStatusButton, EditStatusButton, SetDefaultStatusButton } from "features/status"

import { useProjectContext } from "pages/project"

import { Status, TableFilterSearch, TableSorting } from "shared/ui"

interface Props {
  onChangeOrder: (statuses: Status[]) => void
}

const columnHelper = createColumnHelper<Status>()
export const StatusesTable = ({ onChangeOrder }: Props) => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const { data = [], isFetching } = useGetStatusesQuery({ project: project.id })

  const [dataSource, setDataSource] = useState(data)

  useEffect(() => {
    setDataSource(data)
  }, [data])

  const handleDataChange = (dataStatuses: Status[]) => {
    onChangeOrder(dataStatuses)
    setDataSource(dataStatuses)
  }

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
      cell: (info) => info.getValue(),
      size: 100,
      meta: {
        useInDataTestId: true,
      },
    }),
    columnHelper.accessor((row) => row.name, {
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
      cell: (info) => (
        <Status
          id={info.row.original.id}
          name={info.row.original.name}
          color={info.row.original.color}
        />
      ),
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("type", {
      id: "type",
      header: () => "Type",
      cell: (info) => getStatusTypeTextByNumber(info.row.original.type),
      meta: {
        responsiveSize: true,
      },
    }),
    {
      id: "default",
      header: () => "Default",
      cell: (info: CellContext<Status, number>) => (
        <SetDefaultStatusButton record={info.row.original} />
      ),
      meta: {
        responsiveSize: true,
      },
    },
    {
      id: "actions",
      header: t("Actions"),
      cell: ({ row }) => {
        if (!row.original.type) return null // hide actions for default statuses
        return (
          <Space>
            <EditStatusButton record={row.original} />
            <DeleteStatusButton record={row.original} />
          </Space>
        )
      },
      size: 100,
    } as ColumnDef<Status>,
  ]

  return (
    <DataTable
      isLoading={isFetching}
      data={dataSource}
      columns={columns}
      enableRowDragging
      onDataChange={handleDataChange}
      data-testid="statuses-table"
    />
  )
}
