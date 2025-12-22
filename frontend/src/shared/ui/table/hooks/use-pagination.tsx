import { PaginationState } from "@tanstack/react-table"
import { useState } from "react"

interface Props {
  defaultPageIndex?: number
  defaultPageSize?: number
}

export const usePagination = (options?: Props) => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: options?.defaultPageIndex ?? 0,
    pageSize: options?.defaultPageSize ?? 10,
  })

  const setPage = (pageIndex: number) => {
    setPagination({ ...pagination, pageIndex })
  }

  const setPageSize = (pageSize: number) => {
    setPagination({ ...pagination, pageSize })
  }

  const resetPagination = (resetOptions?: Partial<PaginationState>) => {
    setPagination({
      pageIndex: resetOptions?.pageIndex ?? options?.defaultPageIndex ?? 0,
      pageSize: resetOptions?.pageSize ?? options?.defaultPageSize ?? 10,
    })
  }

  return {
    pagination,
    setPagination,
    setPage,
    setPageSize,
    resetPagination,
  }
}
