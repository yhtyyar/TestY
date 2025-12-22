import { Typography } from "antd"
import { DataTable } from "widgets"

import { useMyTranslation } from "shared/hooks"

import { useProjectOverviewProgress } from "widgets/project/model/use-project-overview-progress"

import styles from "./styles.module.css"

export const ProjectTestsProgressBlock = () => {
  const { t, language } = useMyTranslation(["translation", "common"])
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
          formatTotalText={(count) => t("common:paginationTotal", { count })}
          lang={language}
          data-testid="projects-overview-table"
        />
      </div>
    </div>
  )
}
