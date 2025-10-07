import type { TooltipProps } from "recharts"

import { StatusStatistic } from "shared/ui"

import styles from "./styles.module.css"

export const TestPlanStatisticTooltipHistogram = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className={styles.wrapper}>
      {label && (
        <div className={styles.label} data-testid="test-plan-statistic-tooltip-histogram-label">
          {label}
        </div>
      )}
      <div className={styles.list}>
        {payload.map((entry) => (
          <div key={String(entry.name)} className={styles.row}>
            <StatusStatistic
              id="test-plan-statistic-tooltip-histogram"
              color={
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                entry.color ?? entry.payload?.color ?? "var(--y-secondary-color-text-secondary)"
              }
              label={String(entry.name)}
            />
            <span className={styles.value}>{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
