import { Select } from "antd"
import { SelectProps } from "antd/lib"
import { CustomTagProps } from "rc-select/lib/BaseSelect"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import styles from "./label-select.module.css"

type ChangedSelectProps = Omit<SelectProps, "popupRender" | "tagRender">

interface Props extends ChangedSelectProps {
  data: Label[]
  isLoading: boolean
  value: SelectedLabel[]
  onChange: (value: SelectedLabel[]) => void
  popupRender: (viewList: Label[]) => JSX.Element
  tagRender: (tagProps: CustomTagProps) => JSX.Element
}

export const LabelSelect = ({
  data = [],
  isLoading,
  value,
  onChange,
  tagRender,
  popupRender,
  ...props
}: Props) => {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState("")

  const allOptions = useMemo(() => {
    return data.map((item) => ({ value: item.id, title: item.name }))
  }, [data])

  const list = useMemo(() => {
    const selectedIds = new Set(value.map((item) => item.value))

    return data.filter((item) => {
      if (selectedIds.has(item.id)) {
        return false
      }

      if (searchValue) {
        return item.name.toLowerCase().includes(searchValue.toLowerCase())
      }

      return true
    })
  }, [data, value, searchValue])

  return (
    <Select
      mode="multiple"
      allowClear
      style={{ width: "100%" }}
      placeholder={t("Select label")}
      loading={isLoading}
      disabled={isLoading}
      searchValue={searchValue}
      showSearch
      autoClearSearchValue={false}
      onSearch={setSearchValue}
      onChange={onChange}
      value={value}
      labelInValue
      options={allOptions}
      tagRender={tagRender}
      menuItemSelectedIcon={null}
      className={styles.labelFilterSelect}
      styles={{
        popup: {
          root: {
            padding: 8,
            maxHeight: 400,
            overflow: "auto",
          },
        },
      }}
      popupRender={() => popupRender(list)}
      {...props}
    />
  )
}
