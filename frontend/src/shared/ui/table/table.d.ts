import "@tanstack/react-table"
import { CSSProperties } from "react"

declare module "@tanstack/react-table" {
  interface TableState {
    rowActiveKey?: number
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    responsiveSize?: boolean
    fullWidth?: boolean
    useInDataTestId?: boolean
    align?: "left" | "center" | "right"
    wordBreak?: CSSProperties["wordBreak"]
  }
}
