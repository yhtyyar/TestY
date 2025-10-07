import { SearchOutlined } from "@ant-design/icons"
import { Column } from "@tanstack/react-table"
import { Flex, Input, Popover } from "antd"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui/button"

interface ColumnMetaType {
  placeholder?: string
  disabled?: boolean
}

interface Props<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: Column<T, any> & {
    columnDef: {
      meta?: ColumnMetaType
    }
  }
}

// eslint-disable-next-line comma-spacing
export const TableFilterSearch = <T,>({ column }: Props<T>) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  const onValueChange = (newValue: string) => {
    setValue(newValue)
  }

  const onValueClear = () => {
    setValue("")
    column.setFilterValue("")
  }

  const onSearch = () => {
    column.setFilterValue(value)
    setOpen(false)
  }

  const onClose = () => {
    setOpen(false)
  }

  useEffect(() => {
    setValue((column.getFilterValue() as string) ?? "")
  }, [column.getFilterValue()])

  const placeholder = column.columnDef.meta?.placeholder ?? t("Search")
  const disabled = column.columnDef.meta?.disabled ?? false

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      content={
        <Flex gap={8} vertical>
          <Input
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => onValueChange(e.target.value)}
            allowClear
            onClear={onValueClear}
            data-testid={`${column.id}-search-input`}
          />
          <Flex align="center" justify="space-between" gap={8}>
            <Button
              size="s"
              color="secondary"
              onClick={onClose}
              data-testid={`${column.id}-search-close`}
            >
              {t("Close")}
            </Button>
            <Button
              size="s"
              color="accent"
              onClick={onSearch}
              disabled={disabled}
              data-testid={`${column.id}-search-button`}
            >
              {t("Search")}
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
        data-testid={`${column.id}-search-icon`}
        icon={
          <SearchOutlined
            style={{
              fontSize: 10,
              color: value.length > 0 ? "var(--y-color-accent)" : "var(--y-grey-35)",
            }}
          />
        }
      />
    </Popover>
  )
}
