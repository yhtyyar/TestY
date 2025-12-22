import { ColumnDef, Table, createColumnHelper } from "@tanstack/react-table"
import { Checkbox } from "antd"
import { useGetNotificationsListQuery, useMarkAsMutation } from "entities/notifications/api"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { useAntdModals } from "shared/hooks"
import { usePagination } from "shared/ui"

import styles from "./notifications-table.module.css"

const PLACEHOLDER_TEXT = "{{placeholder}}"
const columnHelper = createColumnHelper<NotificationData>()

const convertToLinkText = (record: NotificationData["message"]) => {
  const { template, placeholder_link, placeholder_text } = record

  const strings = template.split(PLACEHOLDER_TEXT) as [string, string]
  const renderString = (str: string) => !!str.length && <p style={{ margin: 0 }}>{str}</p>
  return (
    <span className={styles.linkRow}>
      {renderString(strings[0])}
      <Link to={placeholder_link}>{placeholder_text}</Link>
      {renderString(strings[1])}
    </span>
  )
}

export const useNotificationsTable = () => {
  const { t } = useTranslation()
  const { initInternalError } = useAntdModals()
  const [markAs] = useMarkAsMutation()

  const tableRef = useRef<Table<NotificationData> | null>(null)
  const { pagination, setPagination } = usePagination()

  const selectedRowKeys =
    tableRef.current?.getSelectedRowModel().rows.map((row) => row.original.id) ?? []

  const { data, isLoading, refetch } = useGetNotificationsListQuery({
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
  })

  const columns = [
    {
      id: "checkbox",
      header: ({ table }) => {
        return (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            onChange={() => table.toggleAllRowsSelected()}
            onClick={(e) => e.stopPropagation()}
            indeterminate={table.getIsSomeRowsSelected()}
          />
        )
      },
      cell: ({ row }) => {
        return (
          <Checkbox
            onClick={(e) => e.stopPropagation()}
            checked={row.getIsSelected()}
            onChange={() => row.toggleSelected()}
          />
        )
      },
      enableSorting: false,
      enableHiding: false,
      size: 50,
    } as ColumnDef<NotificationData>,
    columnHelper.accessor("id", {
      id: "id",
      header: t("ID"),
      cell: (info) => <span style={{ wordBreak: "keep-all" }}>{info.getValue()}</span>,
      size: 70,
      meta: {
        useInDataTestId: true,
      },
    }),
    columnHelper.accessor("message", {
      id: "message",
      header: t("Message"),
      cell: ({ getValue }) => {
        if (!getValue()) {
          return null
        }
        return convertToLinkText(getValue())
      },
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("actor", {
      id: "actor",
      header: t("Actor"),
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("timeago", {
      id: "timeago",
      header: t("Time"),
      meta: {
        responsiveSize: true,
      },
    }),
  ]

  const handleRead = async () => {
    try {
      await markAs({
        unread: false,
        notifications: selectedRowKeys,
      })
      tableRef.current?.resetRowSelection()
      refetch()
    } catch (error) {
      initInternalError(error)
    }
  }

  const handleUnread = async () => {
    try {
      await markAs({
        unread: true,
        notifications: selectedRowKeys,
      })
      tableRef.current?.resetRowSelection()
      refetch()
    } catch (error) {
      initInternalError(error)
    }
  }

  return {
    tableRef,
    isLoading,
    data: data?.results ?? [],
    total: data?.count ?? 0,
    columns,
    paginationParams: pagination,
    selectedRowKeys,
    setPaginationParams: setPagination,
    handleRead,
    handleUnread,
  }
}
