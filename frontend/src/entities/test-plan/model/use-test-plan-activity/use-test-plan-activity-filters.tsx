import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  Updater,
  createColumnHelper,
} from "@tanstack/react-table"
import { Flex } from "antd"
import Search from "antd/lib/input/Search"
import { useStatuses } from "entities/status/model/use-statuses"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useProjectContext } from "pages/project"

import { TableFilterSelect, TableSorting } from "shared/ui"

import { useTestPlanActivity } from "./use-test-plan-activity"

const columnHelper = createColumnHelper<TestPlanActivityResult>()
export const useTestPlanActivityFilters = (
  testPlanActivity: ReturnType<typeof useTestPlanActivity>
) => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const { testPlanId } = useParams<ParamTestPlanId>()

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnSorting, setColumnSorting] = useState<SortingState>([])

  const { statusesFilters } = useStatuses({
    project: project.id,
    plan: testPlanId,
    isActivity: true,
  })

  const filters = useMemo(() => {
    return [
      columnHelper.accessor("action_timestamp", {
        id: "history_date",
        header: ({ column }) => (
          <Flex align="center" justify="space-between" gap={6}>
            <span>{t("Time")}</span>
            <TableSorting column={column} />
          </Flex>
        ),
        size: 150,
        meta: {
          useInDataTestId: true,
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
        size: 150,
      }),
      {
        id: "search",
        header: ({ column }) => {
          return (
            <Search
              placeholder={t("Search by test or user")}
              value={column.getFilterValue() as string}
              onChange={(e) => column.setFilterValue(e.target.value)}
              data-testid="test-plan-activity-search"
            />
          )
        },
        meta: {
          responsiveSize: true,
        },
      } as ColumnDef<TestPlanActivityResult>,
    ]
  }, [statusesFilters])

  const handleColumnFiltersChange = (updater: Updater<ColumnFiltersState>) => {
    if (typeof updater !== "function") return
    const nextState = updater(columnFilters)
    setColumnFilters(nextState)
    testPlanActivity.setGlobalColumnFilters(nextState)
  }

  const handleColumnSortingChange = (updater: Updater<SortingState>) => {
    if (typeof updater !== "function") return
    const nextState = updater(columnSorting)
    setColumnSorting(nextState)
    testPlanActivity.setGlobalColumnSorting(nextState)
  }

  return {
    filters,
    columnFilters,
    columnSorting,
    handleColumnFiltersChange,
    handleColumnSortingChange,
  }
}
