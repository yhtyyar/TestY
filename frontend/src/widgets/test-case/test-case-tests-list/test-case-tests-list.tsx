import { ColumnFiltersState, SortingState, createColumnHelper } from "@tanstack/react-table"
import { Flex } from "antd"
import { useStatuses } from "entities/status/model/use-statuses"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { DataTable } from "widgets"

import { useGetTestCaseTestsListQuery } from "entities/test-case/api"

import { useTestPlanActivityBreadcrumbs } from "entities/test-plan/model"

import { UserAvatar, UserUsername } from "entities/user/ui"

import { useProjectContext } from "pages/project"

import { useMyTranslation } from "shared/hooks"
import { Status, TableFilterSelect, TableSorting, usePagination } from "shared/ui"
import { UntestedStatus } from "shared/ui/status"
import { testySortRequestFormat } from "shared/ui/table/utils"

interface Props {
  testCase: TestCase
  isShowArchive: boolean
}

const columnHelper = createColumnHelper<TestsWithPlanBreadcrumbs>()
export const TestCaseTestsList = ({ testCase, isShowArchive }: Props) => {
  const { t, language } = useMyTranslation(["translation", "entities", "common"])

  const project = useProjectContext()
  const { renderBreadCrumbs } = useTestPlanActivityBreadcrumbs()
  const { pagination, setPagination } = usePagination()

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnSorting, setColumnSorting] = useState<SortingState>([])

  const filterRequest = useMemo(() => {
    const filters: Record<string, unknown> = {}
    columnFilters.forEach((filter) => {
      filters[filter.id] = filter.value
    })
    return filters
  }, [columnFilters])

  const ordering = useMemo(() => testySortRequestFormat(columnSorting), [columnSorting])

  const { statusesFiltersWithUntested } = useStatuses({ project: project.id })

  const { data, isFetching } = useGetTestCaseTestsListQuery(
    {
      testCaseId: testCase.id,
      page: pagination.pageIndex + 1,
      page_size: pagination.pageSize,
      is_archive: isShowArchive,
      ordering,
      ...filterRequest,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  )

  const columns = [
    columnHelper.accessor("id", {
      id: "id",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("ID")}</span>
          <Flex align="center" gap={4}>
            <TableSorting column={column} />
          </Flex>
        </Flex>
      ),
      cell: ({ row }) => (
        <Link
          to={`/projects/${row.original.project}/plans/${row.original.plan}?test=${row.original.id}`}
        >
          {row.original.id}
        </Link>
      ),
      size: 70,
      meta: {
        useInDataTestId: true,
      },
    }),
    columnHelper.accessor("breadcrumbs", {
      id: "breadcrumbs",
      header: t("Test Plan"),
      cell: ({ getValue }) => renderBreadCrumbs(getValue()),
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("last_status", {
      id: "last_status",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Last status")}</span>
          <Flex align="center" gap={4}>
            <TableFilterSelect
              column={column}
              options={statusesFiltersWithUntested.map((i) => ({
                label: i.text,
                key: i.value,
                value: i.value,
              }))}
            />
          </Flex>
        </Flex>
      ),
      cell: ({ row }) => {
        if (!row.original.last_status) {
          return <UntestedStatus />
        }
        return (
          <Status
            id={row.original.last_status}
            name={row.original.last_status_name}
            color={row.original.last_status_color}
          />
        )
      },
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("assignee_username", {
      id: "assignee",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("entities:user.Assignee")}</span>
          <Flex align="center" gap={4}>
            <TableSorting column={column} />
          </Flex>
        </Flex>
      ),
      cell: ({ row }) => {
        if (!row.original.assignee_username) {
          return <span style={{ opacity: 0.7 }}>{t("Nobody")}</span>
        }

        return (
          <div style={{ display: "flex", alignItems: "center", flexDirection: "row", gap: 8 }}>
            <UserAvatar size={32} avatar_link={row.original.avatar_link} />
            <UserUsername username={row.original.assignee_username} />
          </div>
        )
      },
      meta: {
        responsiveSize: true,
      },
    }),
  ]

  return (
    <DataTable
      isLoading={isFetching}
      data={data?.results ?? []}
      columns={columns}
      rowCount={data?.count ?? 0}
      onPaginationChange={setPagination}
      onColumnFiltersChange={setColumnFilters}
      onSortingChange={setColumnSorting}
      state={{
        pagination,
        columnFilters,
        sorting: columnSorting,
      }}
      manualPagination
      manualSorting
      manualFiltering
      formatTotalText={(count) => t("common:paginationTotal", { count })}
      lang={language}
      data-testid="test-case-tests-table"
    />
  )
}
