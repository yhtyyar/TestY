import { Empty, Flex, Typography } from "antd"
import dayjs from "dayjs"
import { DataTable } from "widgets"

import { useTestPlanActivity } from "entities/test-plan/model"

import { useMyTranslation } from "shared/hooks"
import { ContainerLoader, TablePageChanger } from "shared/ui"

export const TestPlanActivityTable = ({
  testPlanActivity,
}: {
  testPlanActivity: ReturnType<typeof useTestPlanActivity>
}) => {
  const { language } = useMyTranslation()
  if (testPlanActivity.isLoading) return <ContainerLoader />

  if (!testPlanActivity.data?.count) return <Empty />

  return (
    <ul style={{ paddingLeft: 0 }}>
      {Object.entries(testPlanActivity.data.results).map(([dayStr, item], index) => (
        <li
          style={{ marginBottom: 24, listStyle: "none" }}
          key={`${index}_${dayStr}`}
          data-testid={`test-plan-activity-table-group-${dayStr}`}
        >
          <Typography.Paragraph strong data-testid={`test-plan-activity-table-title-${dayStr}`}>
            {dayjs(dayStr).format("D MMMM YYYY")}
          </Typography.Paragraph>
          <DataTable
            data={item}
            columns={testPlanActivity.columns}
            manualPagination
            paginationVisible={false}
            lang={language}
            data-testid={`test-plan-activity-table-${dayStr}`}
          />
        </li>
      ))}
      {testPlanActivity.tableFilterRef.current !== null && (
        <Flex justify="end">
          <TablePageChanger
            current={testPlanActivity.tableFilterRef.current.getState().pagination.pageIndex}
            pageSize={testPlanActivity.tableFilterRef.current.getState().pagination.pageSize}
            total={testPlanActivity.data.count}
            onChangePage={(pageIndex) => {
              if (testPlanActivity.tableFilterRef.current) {
                testPlanActivity.setPaginationParams((prevState) => ({
                  ...prevState,
                  pageIndex,
                }))
              }
            }}
          />
        </Flex>
      )}
    </ul>
  )
}
