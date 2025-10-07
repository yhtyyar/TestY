import { ColumnFiltersState, SortingState, Table, createColumnHelper } from "@tanstack/react-table"
import { Flex } from "antd"
import dayjs from "dayjs"
import { useStatuses } from "entities/status/model/use-statuses"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"

import { useGetTestPlanActivityQuery } from "entities/test-plan/api"
import { filterActionFormat } from "entities/test-plan/lib"

import { UserAvatar } from "entities/user/ui"

import { useProjectContext } from "pages/project"

import {
  HighLighterTesty,
  Status,
  TableFilterSearch,
  TableFilterSelect,
  TableSorting,
} from "shared/ui"
import { UntestedStatus } from "shared/ui/status"
import { testySortRequestFormat } from "shared/ui/table/utils"

import { useTestPlanActivityBreadcrumbs } from "./index"

const columnHelper = createColumnHelper<TestPlanActivityResult>()
export const useTestPlanActivity = () => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const { testPlanId } = useParams<ParamTestPlanId>()
  const { statusesFilters } = useStatuses({
    project: project.id,
    plan: testPlanId,
    isActivity: true,
  })

  const [paginationParams, setPaginationParams] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { renderBreadCrumbs } = useTestPlanActivityBreadcrumbs()

  const tableFilterRef = useRef<Table<TestPlanActivityResult> | null>(null)
  const [globalColumnFilters, setGlobalColumnFilters] = useState<ColumnFiltersState>([])
  const [globalColumnSorting, setGlobalColumnSorting] = useState<SortingState>([])

  const filterRequest = useMemo(() => {
    const filters: Record<string, unknown> = {}
    globalColumnFilters.forEach((filter) => {
      if (filter.id === "action") {
        filters.history_type = filterActionFormat(filter.value as string[])
      } else {
        filters[filter.id] = filter.value
      }
    })
    return filters
  }, [globalColumnFilters])

  const ordering = useMemo(() => testySortRequestFormat(globalColumnSorting), [globalColumnSorting])

  const { data, isFetching } = useGetTestPlanActivityQuery(
    {
      testPlanId: testPlanId ?? "",
      page: paginationParams.pageIndex + 1,
      page_size: paginationParams.pageSize,
      ordering,
      ...filterRequest,
    },
    {
      skip: !testPlanId,
    }
  )

  const columns = [
    columnHelper.accessor("action_timestamp", {
      id: "action_timestamp",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Time")}</span>
          <TableSorting column={column} />
        </Flex>
      ),
      cell: ({ getValue, row }) => (
        <div data-testid={`test-plan-activity-time-${row.original.test_name}`}>
          {dayjs(getValue()).format("HH:mm:ss")}
        </div>
      ),
      size: 100,
      meta: {
        useInDataTestId: true,
      },
    }),
    columnHelper.accessor("test_name", {
      id: "test_name",
      header: ({ column }) => (
        <Flex align="center" justify="space-between">
          <span>{t("Test")}</span>
          <TableFilterSearch column={column} />
        </Flex>
      ),
      cell: ({ getValue, row, column }) => {
        const filterSearch = globalColumnFilters.find((f) => f.id === "search")
        return (
          <Link
            to={`/projects/${project.id}/plans/${row.original.breadcrumbs.id}?test=${row.original.test_id}`}
            data-testid={`test-plan-activity-test-link-${row.original.test_name}`}
          >
            <HighLighterTesty
              searchWords={(filterSearch?.value as string) ?? column.getFilterValue() ?? ""}
              textToHighlight={getValue()}
            />
          </Link>
        )
      },
      meta: {
        responsiveSize: true,
        useInDataTestId: true,
      },
    }),
    columnHelper.accessor("breadcrumbs", {
      id: "breadcrumbs",
      header: t("Test Plans"),
      cell: ({ getValue }) => renderBreadCrumbs(getValue()),
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("action", {
      id: "action",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Action")}</span>
          <TableFilterSelect
            column={column}
            options={[
              {
                label: t("added"),
                key: "added",
                value: "added",
              },
              {
                label: t("deleted"),
                key: "deleted",
                value: "deleted",
              },
              {
                label: t("updated"),
                key: "updated",
                value: "updated",
              },
            ]}
          />
        </Flex>
      ),
      cell: ({ getValue, row }) => (
        <div data-testid={`test-plan-activity-action-${row.original.test_name}`}>
          {t(getValue())}
        </div>
      ),
      size: 150,
    }),
    columnHelper.accessor("status", {
      id: "status",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Status")}</span>
          <TableFilterSelect
            column={column}
            options={statusesFilters.map((i) => ({
              label: i.text,
              key: i.value,
              value: i.value,
            }))}
          />
        </Flex>
      ),
      cell: ({ getValue, row }) => {
        if (!getValue()) {
          return <UntestedStatus />
        }
        return (
          <Status
            id={row.original.status}
            name={row.original.status_text}
            color={row.original.status_color}
          />
        )
      },
      size: 150,
    }),
    columnHelper.accessor("username", {
      id: "username",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("User")}</span>
          <TableFilterSearch column={column} />
        </Flex>
      ),
      cell: ({ row }) => (
        <div
          style={{ display: "flex", alignItems: "center", flexDirection: "row", gap: 8 }}
          data-testid={`test-plan-activity-user-${row.original.test_name}`}
        >
          <UserAvatar size={32} avatar_link={row.original.avatar_link} />
          {row.original.username}
        </div>
      ),
      size: 240,
    }),
  ]

  const clearFilters = () => {
    tableFilterRef.current?.resetColumnFilters()
    tableFilterRef.current?.resetSorting()
  }

  return {
    tableFilterRef,
    data,
    isLoading: isFetching,
    columns,
    paginationParams,
    setPaginationParams,
    globalColumnSorting,
    globalColumnFilters,
    clearFilters,
    setGlobalColumnFilters,
    setGlobalColumnSorting,
  }
}
