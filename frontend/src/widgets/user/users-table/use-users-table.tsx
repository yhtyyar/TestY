import { ColumnDef, ColumnFiltersState, Table, createColumnHelper } from "@tanstack/react-table"
import { Flex, Space } from "antd"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAppSelector } from "app/hooks"

import { selectUser } from "entities/auth/model"

import { useGetUsersQuery } from "entities/user/api"
import { UserAvatar } from "entities/user/ui/user-avatar/user-avatar"

import { DeleteUser, EditUser } from "features/user"

import { TableFilterSearch, TableFilterSelect, usePagination } from "shared/ui"
import { CheckedIcon } from "shared/ui/icons"

const columnHelper = createColumnHelper<User>()
export const useUsersTable = () => {
  const { t } = useTranslation()
  const user = useAppSelector(selectUser)
  const tableRef = useRef<Table<User> | null>(null)
  const { pagination, setPagination } = usePagination()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const filterRequest = useMemo(() => {
    const filters: Record<string, unknown> = {}
    columnFilters.forEach((filter) => {
      filters[filter.id] = filter.value
    })
    return filters
  }, [columnFilters])

  const { data: users, isLoading } = useGetUsersQuery({
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
    ...filterRequest,
  })

  const clearAll = () => {
    tableRef.current?.resetColumnFilters()
    tableRef.current?.resetSorting()
  }

  const columns = [
    {
      id: "avatar",
      cell: ({ row }) => <UserAvatar avatar_link={row.original.avatar_link} size={32} />,
      size: 32,
    } as ColumnDef<User>,
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
        useInDataTestId: true,
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
    columnHelper.accessor("is_active", {
      id: "is_active",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Active")}</span>
          <Flex align="center" gap={4} style={{ marginLeft: 4 }}>
            <TableFilterSelect
              column={column}
              options={[{ label: "Active", key: "active", value: true }]}
            />
            <TableFilterSearch column={column} />
          </Flex>
        </Flex>
      ),
      cell: ({ getValue }) => <CheckedIcon value={getValue()} />,
      filterFn: (row, _, filterValue: number[]) => {
        if (!filterValue || filterValue.length === 0) return true
        return filterValue.includes(row.getValue("type"))
      },
      size: 100,
    }),
    columnHelper.accessor("is_superuser", {
      id: "is_superuser",
      header: ({ column }) => (
        <Flex align="center" justify="space-between" gap={6}>
          <span>{t("Admin")}</span>
          <Flex align="center" gap={4} style={{ marginLeft: 4 }}>
            <TableFilterSelect
              column={column}
              options={[{ label: "Admin", key: "admin", value: true }]}
            />
            <TableFilterSearch column={column} />
          </Flex>
        </Flex>
      ),
      cell: ({ getValue }) => <CheckedIcon value={getValue()} />,
      filterFn: (row, _, filterValue: number[]) => {
        if (!filterValue || filterValue.length === 0) return true
        return filterValue.includes(row.getValue("type"))
      },
      size: 100,
    }),
    {
      id: "actions",
      header: t("Actions"),
      cell: ({ row }) => {
        return user?.is_superuser ? (
          <Space>
            <EditUser user={row.original} />
            <DeleteUser user={row.original} />
          </Space>
        ) : null
      },
      size: 110,
    } as ColumnDef<User>,
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
