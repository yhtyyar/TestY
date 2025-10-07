import { TableOutlined } from "@ant-design/icons"
import { Checkbox, Divider, Flex, Popover, Tooltip, Typography } from "antd"
import { memo } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"

interface Props {
  id: string
  columns: ColumnParam[]
  visibilityColumns: ColumnParam[]
  onChange: (data: ColumnParam[]) => void
}

interface CheckboxOption {
  label: string
  value: string
  canHide: boolean
}

const SettingsColumnVisibilityComponent = ({ columns, id, visibilityColumns, onChange }: Props) => {
  const { t } = useTranslation()

  const handleChange = (data: string[]) => {
    const result = columns.filter((i) => data.includes(i.key))
    onChange?.(result)
  }

  const options: CheckboxOption[] = columns.map((i) => ({
    // @ts-ignore
    label: t(i.title),
    value: i.key,
    canHide: i.canHide ?? true,
  }))

  return (
    <Popover
      content={
        <Flex vertical gap={16}>
          <Checkbox.Group
            value={visibilityColumns.map((i) => i.key)}
            onChange={handleChange}
            data-testid="settings-column-visibility-popover"
          >
            <Flex gap={8} vertical>
              {options.map((option) => (
                <Checkbox key={option.value} value={option.value} disabled={!option.canHide}>
                  {option.label}
                </Checkbox>
              ))}
            </Flex>
          </Checkbox.Group>
          <Button
            type="button"
            size="s"
            color="secondary-linear"
            onClick={() => handleChange(options.map((i) => i.value))}
          >
            {t("Select all")}
          </Button>
        </Flex>
      }
      title={
        <Divider orientation="left" style={{ margin: 0 }} orientationMargin={0}>
          <Typography.Text type="secondary">{t("Shown columns")}</Typography.Text>
        </Divider>
      }
      trigger="click"
      placement="bottomRight"
    >
      <Tooltip title={t("Shown columns")}>
        <Button
          id={id}
          icon={
            <TableOutlined
              style={{ color: "var(--y-color-secondary-inline)" }}
              width={18}
              height={18}
            />
          }
          color="secondary-linear"
          shape="square"
        />
      </Tooltip>
    </Popover>
  )
}

export const SettingsColumnVisibility = memo(SettingsColumnVisibilityComponent)
