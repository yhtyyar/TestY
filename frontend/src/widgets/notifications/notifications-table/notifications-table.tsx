import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons"
import { DataTable } from "widgets"

import { useMyTranslation } from "shared/hooks"
import { Button } from "shared/ui"

import styles from "./notifications-table.module.css"
import { useNotificationsTable } from "./use-noitifications-table"

export const NotificationsTable = () => {
  const { t, language } = useMyTranslation(["translation", "common"])
  const {
    tableRef,
    isLoading,
    data,
    total,
    paginationParams,
    selectedRowKeys,
    columns,
    setPaginationParams,
    handleRead,
    handleUnread,
  } = useNotificationsTable()

  return (
    <>
      {!!selectedRowKeys.length && (
        <div>
          <Button
            key="mark-as-read"
            onClick={handleRead}
            icon={<EyeOutlined />}
            disabled={!selectedRowKeys.length}
            color="secondary-linear"
          >
            {t("Mark as read")}
          </Button>
          <Button
            key="mark-as-unread"
            onClick={handleUnread}
            icon={<EyeInvisibleOutlined />}
            disabled={!selectedRowKeys.length}
            style={{ marginLeft: 8 }}
            color="secondary-linear"
          >
            {t("Mark as unread")}
          </Button>
        </div>
      )}
      <DataTable
        tableRef={tableRef}
        isLoading={isLoading}
        data={data}
        rowCount={total}
        columns={columns}
        onPaginationChange={setPaginationParams}
        state={{
          pagination: paginationParams,
        }}
        rowBodyClassName={(row) => (row.original.unread ? styles.unreadRow : styles.readRow)}
        manualPagination
        formatTotalText={(count) => t("common:paginationTotal", { count })}
        lang={language}
        data-testid="notifications-table"
      />
    </>
  )
}
