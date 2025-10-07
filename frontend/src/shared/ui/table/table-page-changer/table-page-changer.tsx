import classNames from "classnames"
import { useEffect, useState } from "react"

import FirstPageIcon from "shared/assets/yi-icons/first-page.svg?react"
import ArrowLeftSolidIcon from "shared/assets/yi-icons/left-solid.svg?react"
import { NumberInput } from "shared/ui"

import styles from "./styles.module.css"

const BASE_DATA_TEST_ID = "table-page-changer"

type Props = React.ComponentProps<"div"> &
  HTMLDataAttribute & {
    current: number
    pageSize: number
    total: number
    onChangePage?: (page: number) => void
  }

export const TablePageChanger = ({
  current,
  pageSize,
  total,
  onChangePage,
  className,
  ...props
}: Props) => {
  const dataTestId = props["data-testid"] ? props["data-testid"] : BASE_DATA_TEST_ID
  const [valuePage, setValuePage] = useState(current)

  const pageCount = Math.max(Math.ceil(total / pageSize), 1)

  const hasPreviousPage = current > 1
  const hasNextPage = current < pageCount

  const firstPage = () => {
    onChangePage?.(0)
  }

  const lastPage = () => {
    onChangePage?.(pageCount)
  }

  const previousPage = () => {
    onChangePage?.(current - 1)
  }

  const nextPage = () => {
    onChangePage?.(current + 1)
  }

  useEffect(() => {
    setValuePage(current)
  }, [current])

  return (
    <div
      className={classNames(styles.tablePageChanger, className)}
      data-testid={dataTestId}
      {...props}
    >
      <button
        type="button"
        className={styles.arrow}
        disabled={!hasPreviousPage}
        onClick={firstPage}
        data-testid={`${dataTestId}-first-page`}
      >
        <FirstPageIcon width={16} height={16} color="var(--y-color-secondary-inline)" />
      </button>
      <button
        type="button"
        className={styles.arrow}
        disabled={!hasPreviousPage}
        onClick={previousPage}
        data-testid={`${dataTestId}-prev-page`}
      >
        <ArrowLeftSolidIcon width={16} height={16} color="var(--y-color-secondary-inline)" />
      </button>
      <NumberInput
        className={styles.currentInput}
        value={valuePage}
        min={1}
        max={pageCount}
        onChange={setValuePage}
        onAccept={(value) => {
          onChangePage?.(value)
        }}
        data-testid={`${dataTestId}-current-page-input`}
      />
      <span>/</span>
      <div className={styles.total} data-testid={`${dataTestId}-total-page`}>
        {pageCount}
      </div>
      <button
        type="button"
        className={styles.arrow}
        disabled={!hasNextPage}
        onClick={nextPage}
        data-testid={`${dataTestId}-next-page`}
      >
        <ArrowLeftSolidIcon
          width={16}
          height={16}
          color="var(--y-color-secondary-inline)"
          style={{ transform: "rotate(180deg)" }}
        />
      </button>
      <button
        type="button"
        className={styles.arrow}
        disabled={!hasNextPage}
        onClick={lastPage}
        data-testid={`${dataTestId}-last-page`}
      >
        <FirstPageIcon
          width={16}
          height={16}
          color="var(--y-color-secondary-inline)"
          style={{ transform: "rotate(180deg)" }}
        />
      </button>
    </div>
  )
}
