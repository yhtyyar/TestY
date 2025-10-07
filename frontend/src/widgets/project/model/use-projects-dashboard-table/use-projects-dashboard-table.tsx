import { ColumnDef, SortingState, createColumnHelper } from "@tanstack/react-table"
import { Flex, Tooltip, Typography } from "antd"
import { useMeContext } from "processes"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { useGetProjectsQuery } from "entities/project/api"
import { ProjectIcon } from "entities/project/ui"

import { FolowProject, RequestProjectAccess } from "features/project"

import DashboardIcon from "shared/assets/yi-icons/dashboard.svg?react"
import TestPlansIcon from "shared/assets/yi-icons/test-plans.svg?react"
import TestSuitesIcon from "shared/assets/yi-icons/test-suites.svg?react"
import { ArchivedTag, HighLighterTesty, TableSorting } from "shared/ui"
import { CheckedIcon } from "shared/ui/icons"
import { testySortRequestFormat } from "shared/ui/table/utils"

import styles from "./styles.module.css"

const { Link } = Typography

const renderNumericValue = (value: number, record: Project) => {
  if (record.is_visible) {
    return Number(value).toLocaleString()
  }
  return "-"
}

const columnHelper = createColumnHelper<Project>()
export const useProjectsDashboardTable = ({ searchName }: { searchName: string }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { userConfig } = useMeContext()
  const [paginationParams, setPaginationParams] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [columnSorting, setColumnSorting] = useState<SortingState>([
    { id: "is_private", desc: false },
  ])

  const ordering = useMemo(() => testySortRequestFormat(columnSorting), [columnSorting])

  const { data: projects, isFetching } = useGetProjectsQuery(
    {
      is_archive: userConfig?.projects?.is_show_archived,
      favorites: userConfig?.projects?.is_only_favorite ?? false,
      page: paginationParams.pageIndex + 1,
      page_size: paginationParams.pageSize,
      name: searchName,
      ordering,
    },
    {
      skip: !userConfig,
    }
  )

  const handleActionClick = (projectId: number, type: "overview" | "suites" | "plans") => {
    navigate(`/projects/${projectId}/${type}`)
  }

  const columns = [
    {
      id: "favorite_archive",
      cell: ({ row }) => (
        <Flex>
          <FolowProject project={row.original} />
          {row.original.is_archive ? (
            <Flex style={{ height: 30 }} align="center">
              <ArchivedTag />
            </Flex>
          ) : null}
        </Flex>
      ),
      size: 64,
    } as ColumnDef<Project>,
    columnHelper.accessor("icon", {
      id: "icon",
      header: t("Icon"),
      cell: ({ row }) => (
        <ProjectIcon
          icon={row.original.icon}
          name={row.original.name}
          dataTestId="dashboard-table-project-icon"
        />
      ),
      size: 50,
    }),
    columnHelper.accessor("name", {
      id: "name",
      header: () => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Name")}</span>
        </Flex>
      ),
      cell: ({ getValue, row }) => {
        const handleLinkClick = () => {
          if (!row.original.is_private || row.original.is_manageable) {
            handleActionClick(row.original.id, "overview")
          }
        }

        const linkEl = (
          <Link onClick={handleLinkClick}>
            <HighLighterTesty searchWords={searchName} textToHighlight={getValue()} />
          </Link>
        )

        if (row.original.is_private && !row.original.is_visible) {
          return (
            <Tooltip placement="topLeft" title={t("You are not able to view this project")} arrow>
              {linkEl}
            </Tooltip>
          )
        }

        return linkEl
      },
      meta: {
        responsiveSize: true,
        useInDataTestId: true,
      },
    }),
    columnHelper.accessor("suites_count", {
      id: "suites_count",
      header: t("Test Suites"),
      cell: ({ row, getValue }) => renderNumericValue(getValue(), row.original),
    }),
    columnHelper.accessor("cases_count", {
      id: "cases_count",
      header: t("Test Cases"),
      cell: ({ row, getValue }) => renderNumericValue(getValue(), row.original),
    }),
    columnHelper.accessor("plans_count", {
      id: "plans_count",
      header: t("Test Plans"),
      cell: ({ row, getValue }) => renderNumericValue(getValue(), row.original),
    }),
    columnHelper.accessor("tests_count", {
      id: "tests_count",
      header: t("Tests"),
      cell: ({ row, getValue }) => renderNumericValue(getValue(), row.original),
    }),
    columnHelper.accessor("is_private", {
      id: "is_private",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Is Private")}</span>
          <TableSorting column={column} />
        </Flex>
      ),
      cell: ({ getValue }) => <CheckedIcon value={getValue()} />,
      size: 120,
    }),
    {
      id: "action",
      cell: ({ row }) =>
        row.original.is_visible ? (
          <Flex className={styles.action} align="center" justify="flex-end" gap={4}>
            <Tooltip title={t("Overview")} placement="top">
              <DashboardIcon onClick={() => handleActionClick(row.original.id, "overview")} />
            </Tooltip>
            <Tooltip title={t("Test Suites")} placement="top">
              <TestSuitesIcon onClick={() => handleActionClick(row.original.id, "suites")} />
            </Tooltip>
            <Tooltip title={t("Test Plans")} placement="top">
              <TestPlansIcon onClick={() => handleActionClick(row.original.id, "plans")} />
            </Tooltip>
          </Flex>
        ) : (
          <RequestProjectAccess project={row.original} type="min" />
        ),
      size: 128,
    } as ColumnDef<Project>,
  ]

  return {
    columns,
    data: projects?.results ?? [],
    total: projects?.count ?? 0,
    isLoading: isFetching,
    paginationParams,
    columnSorting,
    setColumnSorting,
    setPaginationParams,
  }
}
