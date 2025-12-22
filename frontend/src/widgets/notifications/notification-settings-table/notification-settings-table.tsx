import { createColumnHelper } from "@tanstack/react-table"
import { Switch } from "antd"
import {
  useDisableNotificationMutation,
  useEnableNotificationMutation,
  useGetNotificationSettingsQuery,
} from "entities/notifications/api"
import { useState } from "react"
import { DataTable } from "widgets"

import { useAntdModals, useMyTranslation } from "shared/hooks"

const columnHelper = createColumnHelper<NotificationSetting>()
export const NotificationSettingsTable = () => {
  const { t, language } = useMyTranslation(["translation", "common"])
  const { initInternalError } = useAntdModals()
  const { data = [], isFetching } = useGetNotificationSettingsQuery()
  const [enableSetting] = useEnableNotificationMutation()
  const [disableSetting] = useDisableNotificationMutation()
  const [isEnableLoading, setIsEnableLoading] = useState(false)

  const handleChangeSetting = async (action_code: number, enabled: boolean) => {
    const reqData = {
      settings: [action_code],
    }

    try {
      setIsEnableLoading(true)
      if (enabled) {
        await enableSetting(reqData)
      } else {
        await disableSetting(reqData)
      }
    } catch (e) {
      initInternalError(e)
    } finally {
      setIsEnableLoading(false)
    }
  }

  const columns = [
    columnHelper.accessor("verbose_name", {
      id: "verbose_name",
      header: t("Name"),
      meta: {
        responsiveSize: true,
        useInDataTestId: true,
      },
    }),
    columnHelper.accessor("enabled", {
      id: "enabled",
      header: t("Enabled"),
      cell: ({ getValue, row }) => (
        <Switch
          checked={getValue()}
          onChange={(checked) => handleChangeSetting(row.original.action_code, checked)}
        />
      ),
      size: 100,
    }),
  ]

  return (
    <DataTable
      isLoading={isFetching || isEnableLoading}
      data={data}
      columns={columns}
      formatTotalText={(count) => t("common:paginationTotal", { count })}
      lang={language}
      data-testid="notification-settings-table"
    />
  )
}
