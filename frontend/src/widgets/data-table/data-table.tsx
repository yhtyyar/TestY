import { flexRender } from "@tanstack/react-table"

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
import { TableProviderProps } from "shared/ui/table"
import { localizationTable } from "shared/ui/table/localization"

import styles from "./styles.module.css"
import { createBestTestId, createDataTestId } from "./utils"

type Props<T> = Omit<TableProviderProps<T>, "children">

export const DataTable = <T extends object>({
  isLoading = false,
  paginationVisible = true,
  tableHeadVisible = true,
  tableBodyVisible = true,
  paginationSizes = config.pageSizeOptions.map(Number),
  rowBodyClassName,
  formatTotalText,
  lang = "en",
  emptyText = localizationTable[lang].empty,
  ...tableOptions
}: Props<T>) => {
  const dataTestId = tableOptions["data-testid"] ? tableOptions["data-testid"] : undefined

  return (
    <TableProvider
      isLoading={isLoading}
      paginationVisible={paginationVisible}
      tableHeadVisible={tableHeadVisible}
      tableBodyVisible={tableBodyVisible}
      paginationSizes={paginationSizes}
      rowBodyClassName={rowBodyClassName}
      formatTotalText={formatTotalText}
      lang={lang}
      emptyText={emptyText}
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
                  <TableEmpty table={table} text={emptyText} />
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
                formatTotalText={formatTotalText}
                data-testid={createDataTestId(dataTestId, `page-sizer`)}
              />
              <TablePageChanger
                current={table.getState().pagination.pageIndex}
                pageSize={table.getState().pagination.pageSize}
                total={tableOptions.rowCount ?? table.getFilteredRowModel().rows.length}
                onChangePage={table.setPageIndex}
                data-testid={createDataTestId(dataTestId, `page-changer`)}
              />
            </TablePagination>
          )}
        </div>
      )}
    </TableProvider>
  )
}
