import { Cell, Row } from "@tanstack/react-table"

export const createDataTestId = (dataTestId: string | undefined, suffix: string) => {
  return dataTestId ? `${dataTestId}-${suffix}` : undefined
}

export const createBestTestId = <T>(
  baseTestId: string | undefined,
  row: Row<T>,
  cell?: Cell<T, unknown>
) => {
  if (!baseTestId) return undefined

  const testIdParts: string[] = []

  row.getVisibleCells().forEach((rowCell) => {
    const useInDataTestId = rowCell.column.columnDef.meta?.useInDataTestId

    if (useInDataTestId) {
      testIdParts.push(String(rowCell.getValue()))
    }
  })

  if (testIdParts.length > 0) {
    if (cell) {
      return `${baseTestId}-col_${cell.column.id}-${testIdParts.join("-")}-${row.index.toString()}`
    } else {
      return `${baseTestId}-${testIdParts.join("-")}-${row.index.toString()}`
    }
  }

  if (cell) {
    return createDataTestId(baseTestId, `col_${cell?.column.id}-${row.index.toString()}`)
  } else {
    return createDataTestId(baseTestId, row.index.toString())
  }
}
