import { Tooltip, Typography } from "antd"
import { useTranslation } from "react-i18next"

import { Label } from "entities/label/ui"

import styles from "./styles.module.css"

interface LabelProps {
  labels: LabelInForm[]
}

const MAX_SHOW_LABELS = 3

export const TestCaseLabels = ({ labels }: LabelProps) => {
  const { t } = useTranslation()
  const shownLabels = labels.slice(0, MAX_SHOW_LABELS)

  return (
    <div className={styles.labels} data-testid="test-case-labels">
      {shownLabels.map((label) => (
        <Label
          key={label.id}
          content={label.name}
          color={label.color}
          truncate
          tooltip
          data-testid={`test-case-label-${label.name}`}
        />
      ))}
      {labels.length > MAX_SHOW_LABELS && (
        <Tooltip title={`${t("Labels")}: ${labels.map((i) => i.name).join(", ")}`}>
          <Typography.Text className={styles.extra}>
            {/* {`+ ${labels.length - MAX_SHOW_LABELS}`} */}
            ...
          </Typography.Text>
        </Tooltip>
      )}
    </div>
  )
}
