import { Column, ColumnFiltersState, createColumnHelper } from "@tanstack/react-table"
import { DatePicker, Progress, Tooltip } from "antd"
import dayjs, { Dayjs } from "dayjs"
import { NoUndefinedRangeValueType } from "rc-picker/lib/PickerInput/RangePicker"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { useGetProjectProgressQuery } from "entities/project/api"

import { useProjectContext } from "pages/project"

import { colors, formatBaseDate } from "shared/config"

interface ProgressItemProps extends HTMLDataAttribute {
  percent: number
  countStr: string
}

const ProgressItem = ({ percent, countStr, ...props }: ProgressItemProps) => {
  return (
    <div {...props}>
      <div style={{ display: "flex", alignItems: "center", flexDirection: "row" }}>
        <Progress
          percent={percent}
          strokeColor={colors.accent}
          trailColor="var(--y-color-secondary)"
          showInfo={false}
        />
        <span style={{ marginLeft: 6, fontSize: 14, textWrap: "nowrap" }}>{percent}%</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 12, textWrap: "nowrap" }}>
        <span>{countStr}</span>
      </div>
    </div>
  )
}

const DEFAULT_DATE_START = dayjs().subtract(7, "days")
const DEFAULT_DATE_END = dayjs()

const columnHelper = createColumnHelper<ProjectsProgress>()
export const useProjectOverviewProgress = () => {
  const { t } = useTranslation()
  const project = useProjectContext()

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {
      id: "tests_progress_period",
      value: [DEFAULT_DATE_START, DEFAULT_DATE_END],
    },
  ])

  const filterRequest = useMemo(() => {
    if (columnFilters.length && columnFilters.some((i) => i.id === "tests_progress_period")) {
      const testsProgressPeriod = columnFilters.find((i) => i.id === "tests_progress_period") as
        | {
            id: "tests_progress_period"
            value: [dayjs.Dayjs, dayjs.Dayjs]
          }
        | undefined

      return {
        period_date_start: testsProgressPeriod
          ? formatBaseDate(testsProgressPeriod.value[0])
          : formatBaseDate(DEFAULT_DATE_START),
        period_date_end: testsProgressPeriod
          ? formatBaseDate(testsProgressPeriod.value[1])
          : formatBaseDate(DEFAULT_DATE_END),
      }
    }

    return {
      period_date_start: formatBaseDate(DEFAULT_DATE_START),
      period_date_end: formatBaseDate(DEFAULT_DATE_END),
    }
  }, [columnFilters])

  const { data, isFetching } = useGetProjectProgressQuery({
    projectId: project.id.toString(),
    ...filterRequest,
  })

  const disabledDateStart = (current: Dayjs) => {
    return !current.isBefore(dayjs())
  }

  const handleDateFilterChange = (
    column: Column<ProjectsProgress>,
    date: NoUndefinedRangeValueType<dayjs.Dayjs> | null
  ) => {
    if (!date?.[0] || !date[1]) {
      return
    }

    column.setFilterValue([date[0], date[1]])
  }

  const columns = [
    columnHelper.accessor("title", {
      id: "title",
      header: t("Test Plans"),
      cell: ({ row }) => (
        <Link
          id={`overview-test-plan-link-${row.original.title}`}
          to={`/projects/${project.id}/plans/${row.original.id}`}
        >
          <Tooltip placement="topLeft" title={row.original.title}>
            {row.original.title}
          </Tooltip>
        </Link>
      ),
      meta: {
        responsiveSize: true,
        useInDataTestId: true,
      },
    }),
    columnHelper.accessor("tests_total", {
      id: "tests_total",
      header: t("Total"),
      cell: ({ row }) => {
        const percent = Math.round(
          (Number(row.original.tests_progress_total) / Number(row.original.tests_total)) * 100
        )
        const countStr = `${row.original.tests_progress_total} / ${row.original.tests_total}`

        return (
          <ProgressItem
            percent={row.original.tests_progress_total ? percent : 0}
            countStr={countStr}
            data-testid={`${row.original.title}-progress-item`}
          />
        )
      },
      size: 280,
    }),
    columnHelper.accessor("tests_progress_period", {
      id: "tests_progress_period",
      header: ({ column }) => {
        const filterValue = column.getFilterValue() as [dayjs.Dayjs, dayjs.Dayjs]
        const valueDate = [filterValue[0], filterValue[1]] as NoUndefinedRangeValueType<dayjs.Dayjs>
        return (
          <DatePicker.RangePicker
            defaultValue={[dayjs().subtract(7, "days"), dayjs()]}
            onChange={(dateRange) => handleDateFilterChange(column, dateRange)}
            value={valueDate}
            disabledDate={disabledDateStart}
            size="small"
            data-testid="project-overview-progress-date-picker"
          />
        )
      },
      cell: ({ row }) => {
        const percent = Math.round(
          (Number(row.original.tests_progress_period) / Number(row.original.tests_progress_total)) *
            100
        )
        return (
          <ProgressItem
            percent={row.original.tests_progress_total ? percent : 0}
            countStr={String(row.original.tests_progress_period)}
            data-testid={`${row.original.title}-progress-period-item`}
          />
        )
      },
      size: 280,
    }),
  ]

  return {
    columns,
    data: data ?? [],
    total: data?.length ?? 0,
    isFetching,
    columnFilters,
    setColumnFilters,
    disabledDateStart,
  }
}
