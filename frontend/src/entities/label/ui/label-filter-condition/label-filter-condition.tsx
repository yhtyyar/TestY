import { Flex } from "antd"
import classNames from "classnames"
import { CSSProperties } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  value: LabelCondition
  onChange: (value: LabelCondition) => void
  disabled?: boolean
  styleBtn?: CSSProperties
}

export const LabelFilterCondition = ({ value, onChange, disabled = false, styleBtn }: Props) => {
  const { t } = useTranslation()

  return (
    <Flex>
      <Button
        type="button"
        color={value !== "and" ? "ghost" : "secondary-linear"}
        className={classNames(styles.btn)}
        onClick={() => onChange("and")}
        disabled={disabled}
        data-testid="label-filter-condition-and"
        aria-checked={value === "and" && !disabled}
        style={styleBtn}
      >
        {t("and").toUpperCase()}
      </Button>
      <Button
        type="button"
        color={value !== "or" ? "ghost" : "secondary-linear"}
        className={classNames(styles.btn)}
        onClick={() => onChange("or")}
        disabled={disabled}
        data-testid="label-filter-condition-or"
        aria-checked={value === "or" && !disabled}
        style={styleBtn}
      >
        {t("or").toUpperCase()}
      </Button>
    </Flex>
  )
}
