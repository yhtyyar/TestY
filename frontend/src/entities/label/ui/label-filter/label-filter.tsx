import { CustomTagProps } from "rc-select/lib/BaseSelect"
import { useCallback, useEffect, useState } from "react"

import { useGetLabelsQuery } from "entities/label/api"
import { LabelList, LabelSelect } from "entities/label/ui"

import { useProjectContext } from "pages/project"

import { Label } from "../label"

export interface LabelFilterValue {
  labels: number[]
  not_labels: number[]
  labels_condition: LabelCondition
}

interface Props {
  value: LabelFilterValue
  onChange: (value: LabelFilterValue) => void
}

export const LabelFilter = ({ value, onChange }: Props) => {
  const project = useProjectContext()
  const { data = [], isFetching } = useGetLabelsQuery({ project: project.id.toString() })
  const [selectedLabels, setSelectedLabels] = useState<SelectedLabel[]>([])

  const handleLabelPopupClick = (label: Label) => {
    setSelectedLabels((prevState) => [
      ...prevState,
      { value: label.id, label: label.name, color: label.color },
    ])
    handleLabelSelectClick(label.id)
  }

  const handleLabelSelectClick = (labelId: number) => {
    const isInLabels = value.labels.includes(labelId)

    const newState = {
      ...value,
      labels: isInLabels ? value.labels.filter((id) => id !== labelId) : [...value.labels, labelId],
      not_labels: isInLabels
        ? [...value.not_labels, labelId]
        : value.not_labels.filter((id) => id !== labelId),
    }
    onChange(newState)
  }

  const handleLabelRemove = (labelId: number) => {
    const newState = {
      ...value,
      labels: value.labels.filter((i) => i !== labelId),
      not_labels: value.not_labels.filter((i) => i !== labelId),
    }
    onChange(newState)
    setSelectedLabels((prevState) => prevState.filter((i) => i.value !== labelId))
  }

  const handleChange = (values: SelectedLabel[]) => {
    const lastLabel = selectedLabels[selectedLabels.length - 1]
    const newState = {
      ...value,
      labels: values.length ? value.labels.filter((i) => i !== lastLabel.value) : [],
      not_labels: values.length ? value.not_labels.filter((i) => i !== lastLabel.value) : [],
    }
    onChange(newState)
    setSelectedLabels(values)
  }

  const tagRender = useCallback(
    ({ label, value: labelId }: CustomTagProps) => {
      const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
        event.preventDefault()
        event.stopPropagation()
      }

      const hasInNotLabels = value.not_labels.some((i) => i === labelId)
      const foundLabel = data.find((i) => i.id === Number(labelId))

      return (
        <div onMouseDown={onPreventMouseDown}>
          <Label
            content={String(label)}
            color={foundLabel?.color ?? null}
            lineThrough={hasInNotLabels}
            onClick={() => handleLabelSelectClick(Number(labelId))}
            onDelete={() => handleLabelRemove(Number(labelId))}
            truncate
            tooltip
          />
        </div>
      )
    },
    [value, handleLabelRemove, handleLabelSelectClick]
  )

  useEffect(() => {
    const allLabelIds = [...value.labels, ...value.not_labels]
    if (allLabelIds.length === 0) {
      setSelectedLabels([])
      return
    }

    const needsUpdate =
      allLabelIds.length !== selectedLabels.length ||
      selectedLabels.some((sl) => sl.label === "" && data.length > 0)

    if (needsUpdate && data.length > 0) {
      setSelectedLabels(
        allLabelIds.map((labelId) => {
          const label = data.find((item) => item.id === labelId)
          return { value: labelId, label: label?.name ?? "", color: label?.color ?? "" }
        })
      )
    }
  }, [value, data])

  return (
    <LabelSelect
      data={data}
      isLoading={isFetching}
      value={!isFetching ? selectedLabels : []}
      onChange={handleChange}
      tagRender={tagRender}
      popupRender={(list) => (
        <LabelList id="label-filter" isLoading={isFetching} showAll>
          {list.map((label) => {
            return (
              <li key={label.id} data-testid={`label-filter-label-${label.name}`}>
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
      )}
    />
  )
}
