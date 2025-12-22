import { PlusOutlined } from "@ant-design/icons"
import { Button, Flex, Input } from "antd"
import { CustomTagProps } from "rc-select/lib/BaseSelect"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { useGetLabelsQuery } from "entities/label/api"

import { useProjectContext } from "pages/project"

import { useAntdModals } from "shared/hooks"

import { Label } from "../label"
import { LabelList } from "../label-list"
import { LabelSelect } from "../label-select/label-select"

interface Props {
  id?: string
  value: SelectedLabel[]
  onChange: (value: SelectedLabel[]) => void
  noAdding?: boolean
  fieldProps?: { onBlur: () => void }
}

export const LabelSelectWithAdd = ({
  id,
  value,
  onChange,
  noAdding = false,
  fieldProps,
}: Props) => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const { data = [], isFetching } = useGetLabelsQuery({ project: project.id.toString() })
  const [newLabelValue, setNewLabelValue] = useState("")
  const { antdNotification } = useAntdModals()

  const handleLabelPopupClick = (label: Label) => {
    onChange([...value, { value: label.id, label: label.name, color: label.color }])
  }

  const handleCreateLabel = () => {
    if (!newLabelValue?.length) return
    const foundInData = data.find((i) => i.name.toLowerCase() === newLabelValue.toLowerCase())
    const foundInValue = value.find((i) => i.label.toLowerCase() === newLabelValue.toLowerCase())

    if (foundInData ?? foundInValue) {
      antdNotification.error("label-select-with-add", {
        description: t("Label with this name already exists"),
      })
      return
    }

    onChange([...value, { label: newLabelValue, color: null }])
    setNewLabelValue("")
  }

  const handleLabelRemove = (_: number, label: string) => {
    onChange(value.filter((i) => i.label !== label))
  }

  const handleSubmitInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key !== "Enter") return
    handleCreateLabel()
  }

  const tagRender = useCallback(
    ({ label, value: labelId }: CustomTagProps) => {
      const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
        event.preventDefault()
        event.stopPropagation()
      }

      const tagId = `${String(label)}-${labelId}`
      const foundLabel = data.find((i) => i.id === Number(labelId))

      return (
        <div key={tagId} onMouseDown={onPreventMouseDown}>
          <Label
            id={tagId}
            content={String(label)}
            color={foundLabel?.color ?? null}
            onDelete={() => handleLabelRemove(Number(labelId), String(label))}
            truncate
            tooltip
          />
        </div>
      )
    },
    [handleLabelRemove]
  )

  return (
    <LabelSelect
      id={id}
      data={data}
      isLoading={isFetching}
      value={value}
      onChange={onChange}
      tagRender={tagRender}
      onBlur={fieldProps?.onBlur}
      styles={{
        popup: {
          root: {
            padding: "0 8px",
            maxHeight: 400,
            overflow: "auto",
          },
        },
      }}
      popupRender={(list) => (
        <Flex vertical style={{ padding: !noAdding ? "8px 0 0 0" : "8px 0" }}>
          <LabelList id="label-select-with-add" isLoading={isFetching} showAll>
            {list.map((label, index) => {
              return (
                <li key={`${label.name}-${index}`} data-testid={`label-${label.name}`}>
                  <Label
                    content={label.name}
                    color={label.color}
                    onClick={() => handleLabelPopupClick(label)}
                    truncate={false}
                    tooltip={false}
                  />
                </li>
              )
            })}
          </LabelList>
          {!noAdding && (
            <Flex
              gap={4}
              style={{
                position: "sticky",
                bottom: 0,
                backgroundColor: "var(--y-color-control-background)",
                padding: "8px 0",
                zIndex: 1,
              }}
            >
              <Input
                placeholder={t("New label")}
                style={{ width: "100%" }}
                value={newLabelValue}
                onChange={(e) => setNewLabelValue(e.target.value)}
                onKeyDown={(e) => handleSubmitInput(e)}
                allowClear
              />
              <Button type="text" icon={<PlusOutlined />} onClick={() => handleCreateLabel()}>
                {t("Add")}
              </Button>
            </Flex>
          )}
        </Flex>
      )}
    />
  )
}
