import { Select, Tooltip } from "antd"
import { useTranslation } from "react-i18next"

import styles from "./styles.module.css"

interface Props {
  options: string[]
  value: string | null
  onChange: (value: string) => void
  hasUnsavedChanges: boolean
}

export const SavedFilters = ({ options, value, onChange, hasUnsavedChanges }: Props) => {
  const { t } = useTranslation()

  return (
    <Select
      options={options.map((item) => ({ value: item, label: item }))}
      onChange={onChange}
      defaultValue={value}
      value={value ?? t("Saved Filters")}
      prefix={hasUnsavedChanges ? <Tooltip title={t("Unsaved Changes")}>*</Tooltip> : null}
      rootClassName={styles.selectRoot}
      data-testid="saved-filters-select"
    />
  )
}
