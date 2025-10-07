import { colors } from "shared/config"
import { StatusStatistic } from "shared/ui"

import styles from "./styles.module.css"

interface Props extends HTMLDataAttribute {
  isActive?: boolean
  color: string
  label: string
  value: number
  estimate: string
  percent: string
  id: string
}

export const StatusStatisticLegend = ({
  isActive,
  color,
  label,
  value,
  estimate,
  percent,
  id,
  ...props
}: Props) => {
  return (
    <div
      className={styles.row}
      style={{ borderBottom: isActive ? `1px solid ${colors.accent}` : "0" }}
      {...props}
    >
      <StatusStatistic id={`${id}-legend`} color={color} label={label} />
      <span className={styles.legendValue}>
        [<span data-testid={`${id}-legend-status-value-${label}`}>{value ?? 0}</span>
        <span data-testid={`${id}-legend-status-estimate-${label}`}>{estimate}</span>] (
        <span data-testid={`${id}-legend-status-percent-${label}`}>{percent}</span>%)
      </span>
    </div>
  )
}
