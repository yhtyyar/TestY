import { DeleteOutlined, EditOutlined } from "@ant-design/icons"
import { ColumnDef, Table, createColumnHelper } from "@tanstack/react-table"
import { Flex, Space } from "antd"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { useDispatch } from "react-redux"
import { DataTable } from "widgets"

import { useDeleteParameterMutation, useGetParametersQuery } from "entities/parameter/api"
import { setParameter, showEditParameterModal } from "entities/parameter/model"

import { useProjectContext } from "pages/project"

import { initInternalError } from "shared/libs"
import { antdModalConfirm, antdNotification } from "shared/libs/antd-modals"
import { Button } from "shared/ui"
import { TableFilterSearch, TableSorting } from "shared/ui"

const columnHelper = createColumnHelper<IParameter>()
export const ParametersTable = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const project = useProjectContext()
  const { data: parameters = [], isFetching } = useGetParametersQuery(project.id)
  const [deleteParameter] = useDeleteParameterMutation()

  const showParameterDetail = (parameter: IParameter) => {
    dispatch(setParameter(parameter))
    dispatch(showEditParameterModal())
  }

  const tableRef = useRef<Table<IParameter> | null>(null)

  const clearAll = () => {
    tableRef.current?.resetColumnFilters()
    tableRef.current?.resetSorting()
  }

  const columns = [
    columnHelper.accessor("data", {
      id: "name",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Name")}</span>
          <Flex gap={4}>
            <TableSorting column={column} />
            <TableFilterSearch column={column} />
          </Flex>
        </Flex>
      ),
      cell: ({ getValue }) => <span data-testid={`${getValue()}-name`}>{getValue()}</span>,
      meta: {
        responsiveSize: true,
        useInDataTestId: true,
      },
    }),
    columnHelper.accessor("group_name", {
      id: "group_name",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Group")}</span>
          <Flex gap={4}>
            <TableSorting column={column} />
            <TableFilterSearch column={column} />
          </Flex>
        </Flex>
      ),
      cell: ({ getValue, row }) => (
        <span data-testid={`${row.original.data}-group-name`}>{getValue()}</span>
      ),
      meta: {
        responsiveSize: true,
      },
    }),
    {
      id: "actions",
      header: t("Actions"),
      cell: ({ row }) => (
        <Space>
          <Button
            id={`${row.original.data}-edit`}
            icon={<EditOutlined />}
            shape="circle"
            onClick={() => showParameterDetail(row.original)}
            color="secondary-linear"
          />
          <Button
            id={`${row.original.data}-delete`}
            icon={<DeleteOutlined />}
            shape="circle"
            danger
            color="secondary-linear"
            onClick={() => {
              antdModalConfirm("delete-parameter", {
                title: t("Do you want to delete these parameter?"),
                okText: t("Delete"),
                onOk: async () => {
                  try {
                    await deleteParameter(row.original.id).unwrap()
                    antdNotification.success("delete-parameter", {
                      description: t("Parameter deleted successfully"),
                    })
                  } catch (err: unknown) {
                    initInternalError(err)
                  }
                },
              })
            }}
          />
        </Space>
      ),
      size: 100,
    } as ColumnDef<IParameter>,
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
        data={parameters}
        columns={columns}
        data-testid="parameters-table"
      />
    </>
  )
}
