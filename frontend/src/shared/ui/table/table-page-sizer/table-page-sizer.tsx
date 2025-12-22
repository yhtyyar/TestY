import classNames from "classnames"
import { useMemo } from "react"

import { localizationTable } from "../localization"
import { useTableProvider } from "../table-provider/table-provider"
import styles from "./styles.module.css"

const BASE_DATA_TEST_ID = "table-page-sizer"

type Props = React.ComponentProps<"div"> &
  HTMLDataAttribute & {
    sizes: number[]
    rowCount: number
    setPageSize: (value: number) => void
    currentSize: number
    formatTotalText?: (count: number) => string
  }

export const TablePageSizer = ({
  className,
  sizes,
  rowCount,
  setPageSize,
  currentSize,
  formatTotalText,
  ...props
}: Props) => {
  const { lang } = useTableProvider()
  const dataTestId = props["data-testid"] ? props["data-testid"] : BASE_DATA_TEST_ID
  const baseTotalText = localizationTable[lang].paginationTotal.replace(
    "{{count}}",
    String(rowCount)
  )

  const sizesList = useMemo(() => {
    const foundInSizes = sizes.find((size) => size === currentSize)
    if (!foundInSizes) {
      return [currentSize, ...sizes].sort((a, b) => a - b)
    }
    return sizes
  }, [sizes, currentSize])

  return (
    <div
      className={classNames(styles.tablePageSizer, className)}
      data-testid={dataTestId}
      {...props}
    >
      <div className={styles.selectWrapper}>
        <select
          className={styles.nativeSelect}
          value={currentSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          data-testid={`${dataTestId}-select`}
        >
          {sizesList.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <span data-testid={`${dataTestId}-total-count`}>
        {formatTotalText ? formatTotalText(rowCount) : baseTotalText}
      </span>
    </div>
  )
}
