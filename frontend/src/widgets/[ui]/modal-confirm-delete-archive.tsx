import { QueryStatus } from "@reduxjs/toolkit/dist/query"
import { ColumnDef } from "@tanstack/react-table"
import { Modal, Typography } from "antd"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"

import { DataTable } from "widgets/data-table/data-table"

interface Props<T> {
  status: QueryStatus
  isShow: boolean
  isLoading: boolean
  isLoadingButton: boolean
  handleClose: () => void
  handleDelete: () => Promise<void>
  data: T[]
  type: "test-plan" | "test-suite" | "test-case" | "test" | "project"
  typeTitle: string
  name: string
  action: "delete" | "archive"
}

interface DataType {
  verbose_name: string
  verbose_name_related_model: string
  count: number
}

// eslint-disable-next-line comma-spacing
export const ModalConfirmDeleteArchive = <T extends DataType>({
  isShow,
  name,
  handleClose,
  isLoading,
  isLoadingButton,
  handleDelete,
  data,
  type,
  typeTitle,
  action,
}: Props<T>) => {
  const { t } = useTranslation()

  const columns: ColumnDef<T>[] = [
    {
      accessorKey: "verbose_name",
      header: t("Name"),
      meta: {
        responsiveSize: true,
        useInDataTestId: true,
      },
    },
    {
      accessorKey: "verbose_name_related_model",
      header: t("Verbose Name Related Model"),
      meta: {
        responsiveSize: true,
      },
    },
    {
      accessorKey: "count",
      header: () => <span style={{ textAlign: "right" }}>{t("Count")}</span>,
      meta: {
        responsiveSize: true,
      },
    },
  ]

  const dataClear = useMemo(() => {
    return data.filter((i) => Boolean(i.count)).map((i, index) => ({ ...i, id: index }))
  }, [data])

  return (
    <Modal
      className={`${type}-${action}-modal`}
      open={isShow}
      title={`${action === "archive" ? t("Archive") : t("Delete")} ${typeTitle} '${name}'`}
      onCancel={handleClose}
      width="530px"
      footer={[
        <Button
          id={`cancel-${type}-${action}`}
          key="back"
          onClick={handleClose}
          color="secondary-linear"
        >
          {t("Cancel")}
        </Button>,
        <Button
          id={`update-${type}-edit`}
          key="submit"
          danger
          onClick={handleDelete}
          loading={isLoadingButton || isLoading}
          color="secondary-linear"
        >
          {action === "archive" ? t("Archive") : t("Delete")}
        </Button>,
      ]}
    >
      <Typography.Paragraph>
        {t("Attention")}: {action === "archive" ? t("Archiving") : t("Deleting")}{" "}
        {t("the selected data in this table will remove it from view")}
      </Typography.Paragraph>
      <DataTable
        isLoading={isLoading}
        data={dataClear}
        columns={columns}
        paginationVisible={false}
        manualPagination
        data-testid={`${type}-${action}-modal-table`}
      />
    </Modal>
  )
}
