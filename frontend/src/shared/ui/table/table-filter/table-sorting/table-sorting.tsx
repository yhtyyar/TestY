import { CaretDownFilled, CaretUpFilled } from "@ant-design/icons"
import { Column } from "@tanstack/react-table"

import { Button } from "shared/ui/button"

import styles from "./styles.module.css"

interface Props<T> {
  column: Column<T, unknown>
}

// eslint-disable-next-line comma-spacing
export const TableSorting = <T,>({ column }: Props<T>) => {
  const handleSortClick = () => {
    column.toggleSorting()
  }

  return (
    <Button
      size="s"
      color="ghost"
      onClick={handleSortClick}
      className={styles.button}
      data-testid={`${column.id}-sort-icon`}
    >
      <CaretUpFilled
        style={{
          color:
            column.getIsSorted() && column.getIsSorted() === "asc"
              ? "var(--y-color-accent)"
              : "var(--y-grey-35)",
          fontSize: 12,
        }}
      />
      <CaretDownFilled
        style={{
          color:
            column.getIsSorted() && column.getIsSorted() === "desc"
              ? "var(--y-color-accent)"
              : "var(--y-grey-35)",
          fontSize: 12,
          marginTop: "-0.3em",
        }}
      />
    </Button>
  )
}
