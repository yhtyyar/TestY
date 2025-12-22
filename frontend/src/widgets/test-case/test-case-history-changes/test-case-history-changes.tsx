import { createColumnHelper } from "@tanstack/react-table"
import { Flex } from "antd"
import dayjs from "dayjs"
import { Link } from "react-router-dom"

import { useGetTestCaseHistoryChangesQuery } from "entities/test-case/api"

import { UserAvatar, UserUsername } from "entities/user/ui"

import { useMyTranslation } from "shared/hooks"
import { usePagination } from "shared/ui"

import { DataTable } from "widgets/data-table/data-table"

const columnHelper = createColumnHelper<TestCaseHistoryChange>()
export const TestCaseHistoryChanges = ({
  testCase,
  onChangeVersion,
}: {
  testCase: TestCase
  onChangeVersion: (v: number) => Promise<void>
}) => {
  const { t, language } = useMyTranslation(["translation", "common"])
  const { pagination, setPagination } = usePagination({
    defaultPageSize: 5,
  })

  const { data, isLoading } = useGetTestCaseHistoryChangesQuery({
    testCaseId: testCase.id,
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
  })

  const columns = [
    columnHelper.accessor("user", {
      id: "user",
      cell: ({ getValue }) => (
        <Flex align="center" gap={4}>
          <UserAvatar size={32} avatar_link={getValue()?.avatar_link ?? null} />
          <UserUsername username={getValue()?.username ?? "unknown"} />
        </Flex>
      ),
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("action", {
      id: "action",
      cell: ({ getValue, row }) => (
        <span data-testid={`${row.original.user?.username}-action`}>{getValue()}</span>
      ),
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("history_date", {
      id: "history_date",
      cell: ({ getValue, row }) => (
        <span data-testid={`${row.original.user?.username}-history-date`}>
          {dayjs(getValue()).format("DD MMM YYYY HH:mm")}
        </span>
      ),
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("version", {
      id: "version",
      cell: ({ getValue, row }) => (
        <Link
          id={`${getValue()}-${row.index}`}
          to={`/projects/${testCase.project}/suites/${testCase.suite.id}?ver=${getValue()}&test_case=${testCase.id}`}
          onClick={() => onChangeVersion(getValue())}
          data-testid={`test-case-history-change-version-${getValue()}`}
        >
          {t("ver.")} {getValue()}
        </Link>
      ),
      meta: {
        responsiveSize: true,
      },
    }),
  ]

  return (
    <DataTable
      isLoading={isLoading}
      data={data?.results ?? []}
      rowCount={data?.count ?? 0}
      columns={columns}
      tableHeadVisible={false}
      manualPagination
      onPaginationChange={setPagination}
      state={{
        pagination,
      }}
      formatTotalText={(count) => t("common:paginationTotal", { count })}
      lang={language}
      data-testid="history-tests-table"
    />
  )
}
