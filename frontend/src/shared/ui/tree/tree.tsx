import { flexRender } from "@tanstack/react-table"

import { useTreeProvider } from "./tree-provider"
import {
  Table,
  TableBody,
  TableBodyRows,
  TableEmpty,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableLoader,
  TableRowLoadMore,
} from "./ui"
import { createDataTestId } from "./utils"

export const Tree = () => {
  const { tree, headVisible, rowVirtualizer, enableVirtualization, dataTestId } = useTreeProvider()
  const isLoading = tree.getState().dataLoading ?? false

  return (
    <Table data-testid={createDataTestId(dataTestId, "table")}>
      {headVisible && (
        <TableHeader data-testid={createDataTestId(dataTestId, "thead")}>
          {tree.getHeaderGroups().map((headerGroup) => (
            <TableHeaderRow key={headerGroup.id} data-testid={createDataTestId(dataTestId, "tr")}>
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
      <TableBody
        style={{
          height: enableVirtualization ? `${rowVirtualizer.getTotalSize()}px` : "auto",
          position: "relative",
        }}
        data-testid={createDataTestId(dataTestId, "tbody")}
      >
        <TableLoader isLoading={isLoading} />
        {!isLoading && (
          <>
            <TableBodyRows rows={tree.getRowModel().rows} />
            <TableRowLoadMore />
          </>
        )}
        {!tree.getRowModel().rows?.length && !isLoading && <TableEmpty table={tree} />}
      </TableBody>
    </Table>
  )
}
