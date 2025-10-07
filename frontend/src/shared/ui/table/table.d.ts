import "@tanstack/table-core"

declare module "@tanstack/table-core" {
  interface TableState {
    rowActiveKey?: number
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    responsiveSize?: boolean
    fullWidth?: boolean
    useInDataTestId?: boolean
  }
}
