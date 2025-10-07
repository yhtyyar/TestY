import { Row, RowModel, TableOptions, Table as TableType, flexRender } from "@tanstack/react-table"
import { MutableRefObject } from "react"

import { config } from "shared/config"
import {
  Table,
  TableBody,
  TableBodyRow,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableLoader,
  TablePageChanger,
  TablePageSizer,
  TablePagination,
  TableProvider,
} from "shared/ui"

import styles from "./styles.module.css"
import { createBestTestId, createDataTestId } from "./utils"

type Props<T> = {
  tableRef?: MutableRefObject<TableType<T> | null>
  isLoading?: boolean
  enableColumnDragging?: boolean
  draggingColumnCacheKey?: string
  resizeColumnCacheKey?: string
  enableRowDragging?: boolean
  paginationSizes?: number[]
  rowBodyClassName?: string | ((row: Row<T>) => string)
  paginationVisible?: boolean
  tableHeadVisible?: boolean
  tableBodyVisible?: boolean
  color?: "linear" | "solid"
  onRowClick?: (row: Row<T>) => void
  getCoreRowModel?: (table: TableType<T>) => () => RowModel<T>
  onDataChange?: (data: T[]) => void
} & Omit<TableOptions<T>, "getCoreRowModel"> &
  HTMLDataAttribute

export const DataTable = <T extends object>({
  tableRef,
  isLoading = false,
  enableColumnDragging = false,
  draggingColumnCacheKey,
  resizeColumnCacheKey,
  enableRowDragging = false,
  paginationVisible = true,
  tableHeadVisible = true,
  tableBodyVisible = true,
  paginationSizes = config.pageSizeOptions.map(Number),
  rowBodyClassName,
  onDataChange,
  color = "solid",
  ...tableOptions
}: Props<T>) => {
  const dataTestId = tableOptions["data-testid"] ? tableOptions["data-testid"] : undefined

  return (
    <TableProvider
      isLoading={isLoading}
      enableColumnDragging={enableColumnDragging}
      draggingColumnCacheKey={draggingColumnCacheKey}
      resizeColumnCacheKey={resizeColumnCacheKey}
      enableRowDragging={enableRowDragging}
      onDataChange={onDataChange}
      color={color}
      tableRef={tableRef}
      {...tableOptions}
    >
      {(table) => (
        <div className={styles.tableWrapper}>
          <Table data-testid={createDataTestId(dataTestId, "table")}>
            <TableLoader isLoading={isLoading} />
            {tableHeadVisible && (
              <TableHeader data-testid={createDataTestId(dataTestId, "thead")}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableHeaderRow
                    key={headerGroup.id}
                    data-testid={createDataTestId(dataTestId, "tr")}
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        header={header}
                        data-testid={createDataTestId(dataTestId, "th")}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableHeaderRow>
                ))}
              </TableHeader>
            )}
            {tableBodyVisible && (
              <TableBody data-testid={createDataTestId(dataTestId, "tbody")}>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableBodyRow
                      key={row.id}
                      row={row}
                      data-active={table.getState().rowActiveKey === Number(row.id)}
                      onClick={
                        tableOptions.onRowClick
                          ? (e) => {
                              e.preventDefault()
                              tableOptions.onRowClick?.(row)
                            }
                          : undefined
                      }
                      className={
                        rowBodyClassName
                          ? typeof rowBodyClassName === "function"
                            ? rowBodyClassName(row)
                            : rowBodyClassName
                          : undefined
                      }
                      data-testid={createBestTestId(`${dataTestId}-tr`, row)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          cell={cell}
                          data-testid={createBestTestId(`${dataTestId}-td`, row, cell)}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableBodyRow>
                  ))
                ) : (
                  <TableEmpty table={table} />
                )}
              </TableBody>
            )}
          </Table>
          {paginationVisible && (
            <TablePagination>
              <TablePageSizer
                rowCount={tableOptions.rowCount ?? table.getFilteredRowModel().rows.length}
                setPageSize={table.setPageSize}
                sizes={paginationSizes}
                currentSize={table.getState().pagination.pageSize}
                data-testid={createDataTestId(dataTestId, `page-sizer`)}
              />
              <TablePageChanger
                current={table.getState().pagination.pageIndex + 1}
                pageSize={table.getState().pagination.pageSize}
                total={tableOptions.rowCount ?? table.getFilteredRowModel().rows.length}
                onChangePage={(page) => {
                  table.setPageIndex(page - 1)
                }}
                data-testid={createDataTestId(dataTestId, `page-changer`)}
              />
            </TablePagination>
          )}
        </div>
      )}
    </TableProvider>
  )
}
