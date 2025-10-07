import { Select } from "antd"
import classNames from "classnames"
import { useTranslation } from "react-i18next"

import styles from "./styles.module.css"

const BASE_DATA_TEST_ID = "table-page-sizer"

type Props = React.ComponentProps<"div"> &
  HTMLDataAttribute & {
    sizes: number[]
    rowCount: number
    setPageSize: (value: number) => void
    currentSize: number
  }

export const TablePageSizer = ({
  className,
  sizes,
  rowCount,
  setPageSize,
  currentSize,
  ...props
}: Props) => {
  const { t } = useTranslation("common")
  const dataTestId = props["data-testid"] ? props["data-testid"] : BASE_DATA_TEST_ID
  const options = sizes.map((i) => ({ label: i, value: i }))

  return (
    <div
      className={classNames(styles.tablePageSizer, className)}
      data-testid={dataTestId}
      {...props}
    >
      <Select
        value={currentSize}
        defaultValue={sizes[0]}
        options={options}
        onChange={setPageSize}
        style={{ width: 66 }}
        data-testid={`${dataTestId}-select`}
      />
      <span data-testid={`${dataTestId}-total-count`}>
        {t("paginationTotal", { count: rowCount })}
      </span>
    </div>
  )
}
