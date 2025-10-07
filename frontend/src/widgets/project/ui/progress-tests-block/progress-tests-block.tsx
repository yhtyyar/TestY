import { Typography } from "antd"
import { useTranslation } from "react-i18next"
import { DataTable } from "widgets"

import { useProjectOverviewProgress } from "widgets/project/model/use-project-overview-progress"

import styles from "./styles.module.css"

export const ProjectTestsProgressBlock = () => {
  const { t } = useTranslation()
  const { columns, data, isFetching, total, columnFilters, setColumnFilters } =
    useProjectOverviewProgress()

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <Typography.Title level={4}>{t("Executed tests progress")}</Typography.Title>
      </div>
      <div className={styles.table}>
        <DataTable
          isLoading={isFetching}
          data={data}
          columns={columns}
          rowCount={total}
          onColumnFiltersChange={setColumnFilters}
          state={{
            columnFilters,
          }}
          manualFiltering
          data-testid="projects-overview-table"
        />
      </div>
    </div>
  )
}
