import { Space, Typography } from "antd"
import { useTranslation } from "react-i18next"
import { DataTable } from "widgets"

import { useTestPlanActivity, useTestPlanActivityFilters } from "entities/test-plan/model"

import { Button } from "shared/ui"

export const TestPlanActivityFilters = ({
  testPlanActivity,
}: {
  testPlanActivity: ReturnType<typeof useTestPlanActivity>
}) => {
  const { t } = useTranslation()
  const {
    filters,
    columnFilters,
    columnSorting,
    handleColumnFiltersChange,
    handleColumnSortingChange,
  } = useTestPlanActivityFilters(testPlanActivity)

  return (
    <div
      style={{ display: "flex", marginBottom: 48, flexDirection: "column" }}
      data-testid="test-plan-activity-filters"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <Typography.Paragraph strong style={{ marginBottom: 0 }}>
          {t("Common Filters")}
        </Typography.Paragraph>

        <Space style={{ display: "flex", justifyContent: "right" }}>
          <Button
            id="clear-filters-and-sorters"
            onClick={testPlanActivity.clearFilters}
            color="secondary-linear"
          >
            {t("Clear filters and sorters")}
          </Button>
        </Space>
      </div>
      <DataTable
        tableRef={testPlanActivity.tableFilterRef}
        data={[]}
        columns={filters}
        onColumnFiltersChange={handleColumnFiltersChange}
        onSortingChange={handleColumnSortingChange}
        state={{
          columnFilters,
          sorting: columnSorting,
          pagination: testPlanActivity.paginationParams,
        }}
        manualFiltering
        manualSorting
        paginationVisible={false}
        tableBodyVisible={false}
        data-testid="test-plan-activity-filters"
      />
    </div>
  )
}
