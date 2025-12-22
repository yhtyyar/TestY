import {
  ColumnDef,
  PaginationState,
  Row,
  Table,
  Updater,
  createColumnHelper,
} from "@tanstack/react-table"
import { VisibilityState } from "@tanstack/react-table"
import { Checkbox } from "antd"
import dayjs from "dayjs"
import { useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams, useSearchParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { Label } from "entities/label/ui"

import { useGetSuiteTestCasesQuery } from "entities/suite/api"

import { useGetTestSuiteTestCasesQuery } from "entities/test-case/api"
import {
  selectDrawerTestCase,
  selectFilter,
  selectOrdering,
  selectSettings,
  setDrawerTestCase,
  updateSettings,
} from "entities/test-case/model"

import { useProjectContext } from "pages/project"

import { MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH } from "shared/constants"
import { useRowSelection } from "shared/hooks"
import { ArchivedTag, HighLighterTesty } from "shared/ui"

import styles from "./styles.module.css"

const columnHelper = createColumnHelper<TestCase>()
export const useTestCasesTable = () => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const { testSuiteId } = useParams<ParamTestSuiteId>()
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()

  const testCasesFilter = useAppSelector(selectFilter)
  const testCasesOrdering = useAppSelector(selectOrdering)
  const tableSettings = useAppSelector(selectSettings<TestTableParams>("table"))
  const tableRef = useRef<Table<TestCase> | null>(null)

  const testSuiteIdPrev = useRef(testSuiteId)

  useEffect(() => {
    if (testSuiteIdPrev.current === testSuiteId || tableSettings.page === 1) {
      testSuiteIdPrev.current = testSuiteId
    }
  }, [testSuiteId, tableSettings.page])
  const isWaitingForChangeSuite = testSuiteIdPrev.current !== testSuiteId

  useEffect(() => {
    dispatch(
      updateSettings({
        key: "table",
        settings: {
          testSuiteId: testSuiteId ? Number(testSuiteId) : null,
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
  }, [testSuiteId])

  const queryParams = useMemo(
    () => ({
      project: project.id.toString(),
      suite: testCasesFilter.suites,
      is_archive: testCasesFilter.is_archive,
      labels: testCasesFilter.labels,
      not_labels: testCasesFilter.not_labels,
      labels_condition: testCasesFilter.labels_condition,
      page: tableSettings.page,
      page_size: tableSettings.page_size,
      ordering: testCasesOrdering,
      search: testCasesFilter.name_or_id,
      show_descendants: true,
    }),
    [project.id, testCasesFilter, tableSettings, testCasesOrdering]
  )

  const { data: suitesData, isFetching: isSuitesFetching } = useGetSuiteTestCasesQuery(
    {
      testSuiteId: Number(testSuiteId),
      ...queryParams,
    },
    {
      skip: !testSuiteId || isWaitingForChangeSuite,
    }
  )
  const { data: suitesFromRoot, isFetching: isSuitesFromRootFetching } =
    useGetTestSuiteTestCasesQuery(queryParams, {
      skip: !!testSuiteId || isWaitingForChangeSuite,
    })

  const data = testSuiteId ? suitesData : suitesFromRoot
  const isFetching = testSuiteId ? isSuitesFetching : isSuitesFromRootFetching

  const handleRowClick = (row: Row<TestCase>) => {
    searchParams.set("test_case", String(row.original.id))
    setSearchParams(searchParams)
    dispatch(setDrawerTestCase(row.original))
  }

  const selectedTestCase = useAppSelector(selectDrawerTestCase)

  const { rowSelection, handleSelectRow, handleToggleSelectAllRows, setRowSelection, resetAll } =
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

  useEffect(() => {
    resetAll()
  }, [data])

  useEffect(() => {
    if (data) {
      dispatch(
        updateSettings({
          key: "table",
          settings: {
            count: data.count,
          },
        })
      )
    }
  }, [data?.count])

  // TODO Need to think about how to make one API for the table, changing the value in 2 places, it's sad
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
              checked={tableSettings.isAllSelected}
              onChange={() => handleToggleSelectAllRows()}
              onClick={(e) => e.stopPropagation()}
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
      } as ColumnDef<TestCase>,
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
          newQueryParams.delete("test_case")

          return (
            <Link
              id={record.name}
              to={`/projects/${record.project}/suites/${testSuiteId ?? ""}?test_case=${record.id}${newQueryParams.size ? `&${newQueryParams.toString()}` : ""}`}
              className={styles.link}
              onClick={(e) => {
                e.stopPropagation()
                dispatch(setDrawerTestCase(record))
              }}
            >
              {record.is_archive && <ArchivedTag />}
              <HighLighterTesty
                searchWords={testCasesFilter.name_or_id}
                textToHighlight={getValue()}
              />
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
      columnHelper.accessor("suite_path", {
        id: "suite_path",
        header: t("Test Suite"),
        cell: (info) => info.getValue(),
        enableResizing: true,
        size: 350,
        minSize: MIN_COLUMN_WIDTH,
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
      columnHelper.accessor("estimate", {
        id: "estimate",
        header: t("Estimate"),
        cell: ({ getValue }) => getValue() ?? "-",
        enableResizing: true,
        size: 250,
        minSize: MIN_COLUMN_WIDTH,
        maxSize: MAX_COLUMN_WIDTH,
      }),
      columnHelper.accessor("created_at", {
        id: "created_at",
        header: t("Created At"),
        cell: ({ getValue }) => dayjs(getValue()).format("YYYY-MM-DD HH:mm"),
        enableResizing: true,
        size: 160,
        minSize: MIN_COLUMN_WIDTH,
        maxSize: MAX_COLUMN_WIDTH,
      }),
    ]
  }, [testCasesFilter, testSuiteId, tableSettings])

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
          ...tableSettings,
          page: nextState.pageIndex + 1,
          page_size: nextState.pageSize,
        },
      })
    )
  }

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

  return {
    tableRef,
    data: data?.results ?? [],
    total: data?.count ?? 0,
    columns,
    isLoading: isFetching,
    selectedRows: tableSettings.selectedRows,
    selectedTestCase,
    statePagination,
    columnVisibility,
    rowSelection,
    handleTablePaginationChange,
    handleRowClick,
    setRowSelection,
  }
}
