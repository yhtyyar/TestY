import type { TooltipProps } from "recharts"

import { StatusStatistic } from "shared/ui"

import styles from "./styles.module.css"

type Props = {
  isAllZero: boolean
} & TooltipProps<number, string>

interface PayloadPie {
  label: string
  value: number
  color: string
}

export const TestPlanStatisticTooltipPie = ({ active, payload, isAllZero }: Props) => {
  if (!active || !payload?.length || !payload?.[0]?.payload) {
    return null
  }

  const payloadData = payload[0].payload as PayloadPie

  return (
    <div className={styles.wrapper}>
      <div key={String(payloadData.label)} className={styles.row}>
        <StatusStatistic
          id="test-plan-statistic-tooltip-pie"
          color={payloadData.color ?? "var(--y-secondary-color-text-secondary)"}
          label={String(payloadData.label)}
        />
        <span className={styles.value}>{!isAllZero ? payloadData.value : 0}</span>
      </div>
    </div>
  )
}
