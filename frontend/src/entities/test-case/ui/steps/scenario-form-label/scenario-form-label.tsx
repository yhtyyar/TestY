import { Flex } from "antd"
import { useFieldArray, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import CollapseIcon from "shared/assets/yi-icons/collapse-3.svg?react"
import ExpandIcon from "shared/assets/yi-icons/expand-2.svg?react"
import { Toggle } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  type: "create" | "edit"
  isSteps: boolean
  onIsStepsChange: (toggle: boolean) => void
  onCollapse?: () => void
  onExpand?: () => void
}

export const ScenarioFormLabel = ({
  type,
  isSteps,
  onCollapse,
  onExpand,
  onIsStepsChange,
}: Props) => {
  const { t } = useTranslation()
  const { control, setValue } = useFormContext<TestCaseFormData>()
  const { append, fields } = useFieldArray({
    name: "steps",
    control,
    keyName: "extraId",
  })

  const handleIsStepsChange = (toggle: boolean) => {
    if (!fields.length) {
      const itemId = new Date().getTime()
      append({
        id: itemId,
        name: "",
        scenario: "",
        expected: "",
        sort_order: 1,
        attachments: [],
        isNew: true,
      })
      setValue("expanded_steps", [itemId])
    }
    onIsStepsChange(toggle)
  }

  return (
    <Flex
      style={{ width: "100%", userSelect: "none" }}
      align="center"
      justify="space-between"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <span style={{ marginRight: 16 }}>{t("Scenario")}</span>
      {isSteps && (
        <>
          <Flex
            align="center"
            onClick={onExpand}
            className={styles.labelButton}
            data-testid={`${type}-expand-steps`}
          >
            <ExpandIcon width={16} height={16} />
            {t("Expand")}
          </Flex>
          <Flex
            align="center"
            onClick={onCollapse}
            className={styles.labelButton}
            data-testid={`${type}-collapse-steps`}
          >
            <CollapseIcon width={16} height={16} />
            {t("Collapse")}
          </Flex>
          <div className={styles.line} />
        </>
      )}
      <Toggle
        id="edit-steps-toggle"
        label={t("Steps")}
        checked={isSteps}
        onChange={handleIsStepsChange}
        size="sm"
      />
    </Flex>
  )
}
