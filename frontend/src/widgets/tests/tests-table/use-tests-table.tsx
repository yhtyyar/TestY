import { PlusOutlined } from "@ant-design/icons"
import {
  ColumnDef,
  Row,
  Table,
  Updater,
  VisibilityState,
  createColumnHelper,
} from "@tanstack/react-table"
import { PaginationState } from "@tanstack/react-table"
import { Checkbox, Flex, Tooltip } from "antd"
import dayjs from "dayjs"
import { useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Link, useSearchParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { Label } from "entities/label/ui"

import { useGetTestsQuery } from "entities/test/api"
import {
  selectDrawerTest,
  selectFilter,
  selectOrdering,
  selectSettings,
  setDrawerTest,
  setDrawerView,
  updateSettings,
} from "entities/test/model"

import { useGetTestPlanTestsQuery } from "entities/test-plan/api"

import { UserAvatar, UserUsername } from "entities/user/ui"

import { useProjectContext } from "pages/project"

import { MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH, NOT_ASSIGNED_FILTER_VALUE } from "shared/constants"
import { useRowSelection } from "shared/hooks"
import { ArchivedTag, HighLighterTesty, Status } from "shared/ui"
import { UntestedStatus } from "shared/ui/status"

import styles from "./styles.module.css"

interface Props {
  testPlanId: Id | null
}

const columnHelper = createColumnHelper<Test>()

export const useTestsTable = ({ testPlanId }: Props) => {
  const { t } = useTranslation(["translation", "entities"])
  const project = useProjectContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useAppDispatch()

  const drawerTest = useAppSelector(selectDrawerTest)
  const testsFilter = useAppSelector(selectFilter)
  const testsOrdering = useAppSelector(selectOrdering)
  const tableSettings = useAppSelector(selectSettings<TestTableParams>("table"))

  const testPlanIdPrev = useRef(testPlanId)
  const tableRef = useRef<Table<Test> | null>(null)

  const getPaginationPageForReq = () => {
    /**
     * Фикс ситуации, когда testPlanId уже поменялся, а tableSettings поменяется на следующем рендере
     * и запрос отправляется со смешанными параметрами
     */
    const isPaginationFirstPage = tableSettings.page === 1
    const sameTestPlanId = testPlanIdPrev.current === testPlanId

    if (isPaginationFirstPage) {
      testPlanIdPrev.current = testPlanId
    }

    return sameTestPlanId ? tableSettings.page : 1
  }

  const reqParams = useMemo(() => {
    const page = getPaginationPageForReq()

    return {
      ...testsFilter,
      testPlanId,
      ordering: testsOrdering,
      page,
      page_size: tableSettings.page_size,
    }
  }, [tableSettings, testsOrdering, testsFilter, testPlanId])

  useEffect(() => {
    dispatch(
      updateSettings({
        key: "table",
        settings: {
          testPlanId: Number(testPlanId),
          isResetSelection: true,
        },
      })
    )

    return () => {
      dispatch(
        updateSettings({
          key: "table",
          settings: {
            page: 1,
            isResetSelection: true,
          },
        })
      )
    }
  }, [testPlanId])

  const queryParams = {
    project: project.id,
    testPlanId: reqParams.testPlanId ?? undefined,
    is_archive: reqParams.is_archive,
    labels: reqParams.labels,
    not_labels: reqParams.not_labels,
    labels_condition: reqParams.labels_condition,
    suite: reqParams.suites,
    plan: reqParams.plans,
    last_status: reqParams.statuses,
    ordering: reqParams.ordering,
    page: reqParams.page,
    page_size: reqParams.page_size,
    assignee: reqParams.assignee.filter((assignee) => assignee !== NOT_ASSIGNED_FILTER_VALUE),
    unassigned: reqParams.assignee.includes("null") ? true : undefined,
    search: reqParams.name_or_id,
    show_descendants: true,
    test_plan_started_before: reqParams.test_plan_started_before,
    test_plan_started_after: reqParams.test_plan_started_after,
    test_plan_created_before: reqParams.test_plan_created_before,
    test_plan_created_after: reqParams.test_plan_created_after,
    test_created_before: reqParams.test_created_before,
    test_created_after: reqParams.test_created_after,
  }

  const { data: testPlanData, isFetching: isFetchingTestPlan } = useGetTestPlanTestsQuery(
    queryParams,
    {
      skip: !reqParams.testPlanId,
    }
  )

  const { data: rootTestsData, isFetching: isRootTestsFetching } = useGetTestsQuery(queryParams, {
    skip: !!reqParams.testPlanId,
  })

  const data = reqParams.testPlanId ? testPlanData : rootTestsData

  const { rowSelection, handleSelectRow, handleToggleSelectAllRows, resetAll, setRowSelection } =
    useRowSelection({
      tableRef,
      tableSettings,
      update: (settings: Partial<TestTableParams>) => {
        dispatch(
          updateSettings({
            key: "table",
            settings,
          })
        )
      },
    })

  const isFetching = reqParams.testPlanId ? isFetchingTestPlan : isRootTestsFetching

  const handleRowClick = (row: Row<Test>) => {
    searchParams.set("test", String(row.original.id))
    setSearchParams(searchParams)
    dispatch(setDrawerTest(row.original))
  }

  useEffect(() => {
    resetAll()
  }, [data])

  useEffect(() => {
    if (!data) return
    dispatch(
      updateSettings({
        key: "table",
        settings: {
          count: data.count,
        },
      })
    )
  }, [data?.count])

  // TODO We need to think about how to make one API for the table, changing the value in 2 places, it's sad
  useEffect(() => {
    if (tableSettings.isResetSelection) {
      resetAll()
      dispatch(
        updateSettings({
          key: "table",
          settings: {
            isResetSelection: false,
            selectedRows: [],
            excludedRows: [],
            isAllSelected: false,
          },
        })
      )
    }
  }, [tableSettings.isResetSelection])

  const columns = useMemo(() => {
    return [
      {
        id: "checkbox",
        header: ({ table }) => {
          return (
            <Checkbox
              onClick={(e) => e.stopPropagation()}
              checked={tableSettings.isAllSelected}
              onChange={() => handleToggleSelectAllRows()}
              indeterminate={tableSettings.isAllSelected ? false : table.getIsSomeRowsSelected()}
            />
          )
        },
        cell: ({ row }) => {
          const isExcluded = tableSettings.excludedRows.includes(row.original.id)
          const isChecked = tableSettings.isAllSelected ? !isExcluded : row.getIsSelected()

          return (
            <Checkbox
              onClick={(e) => e.stopPropagation()}
              checked={isChecked}
              onChange={() => handleSelectRow(row)}
            />
          )
        },
        enableSorting: false,
        enableHiding: false,
        size: 50,
      } as ColumnDef<Test>,
      columnHelper.accessor("id", {
        id: "id",
        header: t("ID"),
        cell: (info) => <span style={{ wordBreak: "keep-all" }}>{info.getValue()}</span>,
        size: 70,
        meta: {
          useInDataTestId: true,
        },
      }),
      columnHelper.accessor((row) => row.name, {
        id: "name",
        header: t("Name"),
        cell: ({ row: { original: record }, getValue }) => {
          const newQueryParams = new URLSearchParams(location.search)
          newQueryParams.delete("test")

          return (
            <Link
              id={record.name}
              to={`/projects/${record.project}/plans/${testPlanId ?? ""}?test=${record.id}${newQueryParams.size ? `&${newQueryParams.toString()}` : ""}`}
              className={styles.link}
              onClick={(e) => {
                e.stopPropagation()
                dispatch(setDrawerTest(record))
              }}
            >
              {record.is_archive && <ArchivedTag />}
              <HighLighterTesty searchWords={testsFilter.name_or_id} textToHighlight={getValue()} />
            </Link>
          )
        },
        enableResizing: true,
        size: 350,
        minSize: MIN_COLUMN_WIDTH,
        meta: {
          fullWidth: true,
        },
      }),
      columnHelper.accessor("plan_path", {
        id: "plan_path",
        header: t("Test Plan"),
        cell: (info) => info.getValue(),
        enableResizing: true,
        size: 350,
        minSize: MIN_COLUMN_WIDTH,
        maxSize: MAX_COLUMN_WIDTH,
      }),
      columnHelper.accessor("suite_path", {
        id: "suite_path",
        header: t("Test Suite"),
        cell: (info) => info.getValue(),
        enableResizing: true,
        size: 350,
        minSize: MIN_COLUMN_WIDTH,
        maxSize: MAX_COLUMN_WIDTH,
      }),
      columnHelper.accessor("estimate", {
        id: "estimate",
        header: t("Estimate"),
        cell: ({ getValue }) => getValue() ?? "-",
        enableResizing: true,
        size: 100,
        minSize: 100,
        maxSize: MAX_COLUMN_WIDTH,
      }),
      columnHelper.accessor("labels", {
        id: "labels",
        header: t("Labels"),
        cell: ({ getValue }) => (
          <ul className={styles.list}>
            {getValue().map((label) => (
              <li key={label.id}>
                <Label content={label.name} color={label.color} truncate />
              </li>
            ))}
          </ul>
        ),
        enableResizing: true,
        size: 250,
        minSize: MIN_COLUMN_WIDTH,
        maxSize: MAX_COLUMN_WIDTH,
      }),
      columnHelper.accessor("last_status", {
        id: "last_status",
        header: t("Last status"),
        cell: ({ getValue, row }) => {
          if (!getValue()) {
            return <UntestedStatus />
          }
          return (
            <Status
              name={row.original.last_status_name}
              color={row.original.last_status_color}
              id={row.original.last_status}
            />
          )
        },
        enableResizing: true,
        size: 150,
        minSize: MIN_COLUMN_WIDTH,
        maxSize: MAX_COLUMN_WIDTH,
      }),
      columnHelper.accessor("assignee_username", {
        id: "assignee_username",
        header: t("entities:user.Assignee"),
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
        enableResizing: true,
        size: 250,
        minSize: MIN_COLUMN_WIDTH,
        maxSize: MAX_COLUMN_WIDTH,
      }),
      columnHelper.accessor("created_at", {
        id: "created_at",
        header: t("Created At"),
        cell: ({ getValue }) => (
          <span style={{ wordBreak: "keep-all" }}>
            {dayjs(getValue()).format("YYYY-MM-DD HH:mm")}
          </span>
        ),
        enableResizing: true,
        size: 160,
        minSize: MIN_COLUMN_WIDTH,
        maxSize: MAX_COLUMN_WIDTH,
      }),
      {
        id: "actions-column",
        cell: () => {
          return (
            <Flex
              align="center"
              justify="center"
              style={{ whiteSpace: "nowrap", width: "fit-content" }}
            >
              <Tooltip title={t("Add Result")}>
                <Flex
                  align="center"
                  gap={4}
                  onClick={() => {
                    dispatch(setDrawerView({ view: "addResult", shouldClose: true }))
                  }}
                >
                  <PlusOutlined
                    style={{ color: "var(--y-color-secondary-inline)" }}
                    height={16}
                    width={16}
                  />
                  {t("Result")}
                </Flex>
              </Tooltip>
            </Flex>
          )
        },
        enableSorting: false,
        enableHiding: false,
        size: 76,
      } as ColumnDef<Test>,
    ]
  }, [tableSettings, testsFilter])

  const columnVisibility = useMemo(() => {
    const columnsVisibilityObj = {} as VisibilityState
    columns.forEach((i) => {
      if (!i.id) {
        return
      }

      if (i?.enableHiding === false) {
        columnsVisibilityObj[i.id] = true
      } else {
        columnsVisibilityObj[i.id] = !!tableSettings.visibleColumns.find((col) => col.key === i.id)
      }
    })
    return columnsVisibilityObj
  }, [tableSettings.visibleColumns])

  const statePagination = {
    pageIndex: tableSettings.page - 1,
    pageSize: tableSettings.page_size,
  }

  const handleTablePaginationChange = (updater: Updater<PaginationState>) => {
    if (typeof updater !== "function") return
    const nextState = updater(statePagination)
    dispatch(
      updateSettings({
        key: "table",
        settings: {
          page: nextState.pageIndex + 1,
          page_size: nextState.pageSize,
        },
      })
    )
  }

  return {
    tableRef,
    activeTestId: drawerTest?.id,
    data: data?.results ?? [],
    total: data?.count ?? 0,
    columns,
    isLoading: isFetching,
    statePagination,
    columnVisibility,
    rowSelection,
    handleRowClick,
    handleTablePaginationChange,
    setRowSelection,
  }
}
