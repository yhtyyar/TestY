import { Flex, Spin } from "antd"
import { useTranslation } from "react-i18next"
import { Label, PieChart, Pie as PieRechart, ResponsiveContainer, Tooltip } from "recharts"

import { useAppSelector } from "app/hooks"

import { selectFilter } from "entities/test/model"

import { TestPlanStatisticTooltipPie } from "entities/test-plan/ui"

import { StatisticLegend } from "shared/ui"

import { usePie } from "../model/use-pie"
import styles from "./styles.module.css"

interface Props {
  data: TestPlanStatistics[]
  isLoading: boolean
  height: number
  onHeightChange: (height: number) => void
}

export const TestPlanPieCount = ({ data, isLoading, height, onHeightChange }: Props) => {
  const { t } = useTranslation()
  const testsFilter = useAppSelector(selectFilter)
  const { formatData, total, isAllZero, legendFormatter, tooltipFormatter, chartRef } = usePie({
    data: data ?? [],
    statuses: testsFilter.statuses,
    type: "value",
    onHeightChange,
    id: "tests-count",
  })

  return (
    <div className={styles.pieWrapper} id="test-plan-pie-count-wrapper">
      <h3 className={styles.graphsTitle}>{t("Tests Count")}</h3>
      {isLoading && (
        <Flex align="center" justify="center" style={{ height: "100%" }}>
          <Spin size="large" />
        </Flex>
      )}
      {!isLoading && (
        <Flex gap={32} justify="space-between" style={{ width: "100%" }}>
          <Flex align="center" justify="center" style={{ margin: "0 auto" }}>
            <ResponsiveContainer
              width={200}
              height={height}
              ref={chartRef}
              id="test-plan-pie-container"
            >
              <PieChart>
                <PieRechart
                  data={formatData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={84}
                  outerRadius={94}
                  stroke="var(--y-color-background)"
                >
                  <Label
                    value={parseFloat(total.toFixed(2))}
                    position="centerBottom"
                    fontSize={26}
                    fill="var(--y-color-control-text)"
                    style={{ lineHeight: 24, fontWeight: 400 }}
                    dy={0}
                  />
                  <Label
                    position="centerTop"
                    fontSize={16}
                    offset={20}
                    value={t("Total")}
                    style={{ marginTop: 20, lineHeight: 24, fontWeight: 400 }}
                    dy={10}
                  />
                </PieRechart>
                <Tooltip
                  wrapperClassName="recharts-tooltip"
                  formatter={tooltipFormatter}
                  content={<TestPlanStatisticTooltipPie isAllZero={isAllZero} />}
                  wrapperStyle={{ zIndex: "var(--max-z-index)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Flex>
          <Flex style={{ paddingTop: 16, paddingBottom: 16 }}>
            <StatisticLegend
              data={formatData}
              renderStatus={legendFormatter}
              testid="test-plan-pie-count"
            />
          </Flex>
        </Flex>
      )}
    </div>
  )
}
