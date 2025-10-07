import { FilterFilled } from "@ant-design/icons"
import { Column } from "@tanstack/react-table"
import { Checkbox, Divider, Empty, Flex, Popover } from "antd"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui/button"

import styles from "./styles.module.css"

type OptionValue = string | number | boolean
interface Option {
  label: React.ReactNode
  key: string
  value: OptionValue
}

interface Props<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: Column<T, any>
  options: Option[]
}

// eslint-disable-next-line comma-spacing
export const TableFilterSelect = <T,>({ column, options }: Props<T>) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<OptionValue[]>([])

  const onAccept = () => {
    column.setFilterValue(selectedOptions)
    setOpen(false)
  }

  const onReset = () => {
    setSelectedOptions([])
    column.setFilterValue([])
    setOpen(false)
  }

  const handleCheckboxClick = (value: OptionValue) => {
    if (selectedOptions.includes(value)) {
      setSelectedOptions(selectedOptions.filter((item) => item !== value))
    } else {
      setSelectedOptions([...selectedOptions, value])
    }
  }

  useEffect(() => {
    setSelectedOptions((column.getFilterValue() as string[]) ?? "")
  }, [column.getFilterValue()])

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      styles={{ body: { padding: 8, minWidth: 140 } }}
      data-testid={`${column.id}-filter-popover`}
      content={
        <Flex vertical>
          {!options.length && <Empty description={t("No options")} />}
          {options.map((item) => (
            <Flex key={item.key}>
              <Checkbox
                className={styles.checkboxBox}
                checked={selectedOptions.includes(item.value)}
                onChange={() => handleCheckboxClick(item.value)}
              >
                {item.label}
              </Checkbox>
            </Flex>
          ))}
          <Divider style={{ padding: 2, margin: 4 }} />
          <Flex align="center" justify="space-between" gap={8}>
            <Button
              size="s"
              color="secondary"
              onClick={onReset}
              data-testid={`${column.id}-filter-reset`}
            >
              {t("Reset")}
            </Button>
            <Button
              size="s"
              color="accent"
              onClick={onAccept}
              data-testid={`${column.id}-filter-ok`}
            >
              {t("Ok")}
            </Button>
          </Flex>
        </Flex>
      }
      trigger="click"
      placement="bottomRight"
      arrow={false}
    >
      <Button
        color="ghost"
        style={{ width: 20, height: 20, padding: 0 }}
        data-testid={`${column.id}-filter-icon`}
        icon={
          <FilterFilled
            style={{
              fontSize: 10,
              color: selectedOptions.length > 0 ? "var(--y-color-accent)" : "var(--y-grey-35)",
            }}
          />
        }
      />
    </Popover>
  )
}
