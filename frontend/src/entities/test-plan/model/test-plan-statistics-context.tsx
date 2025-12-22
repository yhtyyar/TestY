import { Row } from "@tanstack/react-table"
import { ReactNode, createContext, useContext } from "react"

import { TreeNode } from "shared/ui/tree"

interface TestPlanStatisticsContextType {
  childStatistics?: Record<string, ChildStatisticData>
  isLoading: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate?: (data: Row<TreeNode<Test | TestPlan, any>>[]) => void
}

const TestPlanStatisticsContext = createContext<TestPlanStatisticsContextType | undefined>(
  undefined
)

interface TestPlanStatisticsProviderProps {
  children: ReactNode
  value: TestPlanStatisticsContextType
}

export const TestPlanStatisticsProvider = ({
  children,
  value,
}: TestPlanStatisticsProviderProps) => {
  return (
    <TestPlanStatisticsContext.Provider value={value}>
      {children}
    </TestPlanStatisticsContext.Provider>
  )
}

export const useTestPlanStatisticsContext = () => {
  const context = useContext(TestPlanStatisticsContext)
  if (context === undefined) {
    throw new Error("useTestPlanStatisticsContext must be used within a TestPlanStatisticsProvider")
  }
  return context
}
