import { Form } from "antd"
import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form"

import { LazyGetTriggerType } from "app/export-types"

import { LazyTreeSearch } from "widgets/lazy-tree-search/lazy-tree-search"

interface Props<T extends FieldValues> {
  id: string
  control: Control<T>
  name: Path<T>
  getData: LazyGetTriggerType<PaginationResponse<T[]>>
  getAncestors: LazyGetTriggerType<PaginationResponse<T[]>>
  onSelect: (value: SelectData | null) => void
  label?: string
  placeholder?: string
  formErrors?: FieldErrors<T>
  externalErrors?: FieldValues | null
  required?: boolean
  valueKey?: string
  dataParams?: Record<string, unknown>
  skipInit?: boolean
  selected?: SelectData | null
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >
}

export const LazyTreeSearchFormItem = <T extends FieldValues>({
  id,
  control,
  name,
  label,
  formErrors,
  externalErrors,
  placeholder,
  required = false,
  getData,
  getAncestors,
  onSelect,
  dataParams,
  skipInit = false,
  selected,
  valueKey,
  rules = {},
}: Props<T>) => {
  const errors = (formErrors?.[name]?.message ?? externalErrors?.[name]) as string | undefined

  return (
    <Form.Item
      label={label}
      validateStatus={errors ? "error" : ""}
      help={errors}
      required={required}
    >
      <Controller
        // @ts-ignore
        name="parent"
        control={control}
        rules={rules}
        render={() => (
          <LazyTreeSearch
            id={id}
            // @ts-ignore
            getData={getData}
            // @ts-ignore
            getAncestors={getAncestors}
            valueKey={valueKey}
            skipInit={skipInit}
            dataParams={dataParams}
            placeholder={placeholder}
            onSelect={(node) =>
              onSelect(node ? { label: node.title, value: Number(node.id) } : null)
            }
            selectedId={selected?.value}
            searchValue={selected?.label?.toString() ?? ""}
          />
        )}
      />
    </Form.Item>
  )
}
