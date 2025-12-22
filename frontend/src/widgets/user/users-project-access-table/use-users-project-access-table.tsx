import { ColumnDef, ColumnFiltersState, Table, createColumnHelper } from "@tanstack/react-table"
import { Flex, Space } from "antd"
import { resetOnSuccess, setOnSuccess } from "entities/roles/model"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAppDispatch } from "app/hooks"

import { useGetMembersQuery } from "entities/project/api"

import { UserAvatar } from "entities/user/ui/user-avatar/user-avatar"

import { useProjectContext } from "pages/project"

import { TableFilterSearch, usePagination } from "shared/ui"

import { DeleteUsetProjectAccess } from "../user-project-access-modal/delete-user-project-access"
import { EditUserProjectAccess } from "../user-project-access-modal/edit-user-project-access"

const columnHelper = createColumnHelper<UserWithRoles>()
export const useUsersProjectAccessTable = (isManageable: boolean) => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const dispatch = useAppDispatch()
  const { pagination, setPagination } = usePagination()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const filterRequest = useMemo(() => {
    const filters: Record<string, unknown> = {}
    columnFilters.forEach((filter) => {
      filters[filter.id] = filter.value
    })
    return filters
  }, [columnFilters])

  const {
    data: users,
    isLoading,
    refetch,
  } = useGetMembersQuery({
    id: project.id,
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
    ...filterRequest,
  })

  const handleRefetch = async () => {
    await refetch()
    return
  }

  useEffect(() => {
    Promise.resolve(dispatch(setOnSuccess(handleRefetch)))

    return () => {
      dispatch(resetOnSuccess())
    }
  }, [dispatch, refetch])

  const tableRef = useRef<Table<UserWithRoles> | null>(null)

  const clearAll = () => {
    tableRef.current?.resetColumnFilters()
    tableRef.current?.resetSorting()
  }

  const columns = [
    {
      id: "avatar",
      cell: ({ row }) => <UserAvatar avatar_link={row.original.avatar_link} size={32} />,
      size: 32,
    } as ColumnDef<UserWithRoles>,
    columnHelper.accessor("username", {
      id: "username",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Username")}</span>
          <Flex align="center" gap={4}>
            <TableFilterSearch column={column} />
          </Flex>
        </Flex>
      ),
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("email", {
      id: "email",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Email")}</span>
          <Flex align="center" gap={4}>
            <TableFilterSearch column={column} />
          </Flex>
        </Flex>
      ),
      meta: {
        responsiveSize: true,
        useInDataTestId: true,
      },
    }),
    columnHelper.accessor("first_name", {
      id: "first_name",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("First Name")}</span>
          <Flex align="center" gap={4}>
            <TableFilterSearch column={column} />
          </Flex>
        </Flex>
      ),
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("last_name", {
      id: "last_name",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Last Name")}</span>
          <Flex align="center" gap={4}>
            <TableFilterSearch column={column} />
          </Flex>
        </Flex>
      ),
      meta: {
        responsiveSize: true,
      },
    }),
    columnHelper.accessor("roles", {
      id: "roles",
      header: t("Roles"),
      cell: ({ getValue }) => {
        if (getValue().length === 0) {
          return "-"
        }
        return getValue()
          .map((role) => role.name)
          .join(", ")
      },
      meta: {
        responsiveSize: true,
      },
    }),
    {
      id: "actions",
      header: t("Actions"),
      cell: ({ row }) => (
        <Space>
          {isManageable && <EditUserProjectAccess user={row.original} />}
          {isManageable && <DeleteUsetProjectAccess user={row.original} />}
        </Space>
      ),
      size: 110,
    } as ColumnDef<UserWithRoles>,
  ]

  return {
    tableRef,
    users: users?.results ?? [],
    total: users?.pages.total ?? 0,
    isLoading,
    columns,
    paginationParams: pagination,
    columnFilters,
    setColumnFilters,
    setPaginationParams: setPagination,
    clearAll,
  }
}
