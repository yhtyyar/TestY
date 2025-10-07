import { Form } from "antd"
import { Controller, useFieldArray, useFormContext } from "react-hook-form"

import { ScenarioFormLabel, StepsFormController } from "entities/test-case/ui"

import styles from "./styles.module.css"

interface Props {
  type: "create" | "edit"
  isSteps: boolean
  scenarioFormErrors: string
}

export const StepsFormItem = ({ type, isSteps, scenarioFormErrors }: Props) => {
  const { control, setValue, watch } = useFormContext<TestCaseFormData>()
  const expandedSteps = watch("expanded_steps") ?? []
  const fieldArray = useFieldArray({
    name: "steps",
    control,
    keyName: "extraId",
  })

  const handleCollapse = () => {
    setValue("expanded_steps", [])
  }

  const handleExpand = () => {
    setValue(
      "expanded_steps",
      fieldArray.fields.map(({ id }) => id)
    )
  }

  const handleToggleExpanded = (id: number) => {
    setValue(
      "expanded_steps",
      expandedSteps.includes(id)
        ? expandedSteps.filter((stepId) => stepId !== id)
        : [id, ...expandedSteps]
    )
  }

  return (
    <Form.Item
      label={
        <ScenarioFormLabel
          type={type}
          isSteps={isSteps}
          onIsStepsChange={(toggle) => setValue("is_steps", toggle)}
          onCollapse={handleCollapse}
          onExpand={handleExpand}
        />
      }
      validateStatus={scenarioFormErrors ? "error" : ""}
      help={scenarioFormErrors}
      required
      className={styles.formItem}
    >
      <Controller
        name="steps"
        control={control}
        render={() => (
          <StepsFormController
            fieldArray={fieldArray}
            expandedSteps={expandedSteps}
            onToggleExpanded={handleToggleExpanded}
          />
        )}
      />
    </Form.Item>
  )
}
