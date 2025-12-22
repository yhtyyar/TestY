import { Divider, Flex, Tooltip, Typography } from "antd"
import { memo, useContext } from "react"
import { useTranslation } from "react-i18next"
import { SettingsColumnVisibility } from "widgets"

import { useAppDispatch, useAppSelector } from "app/hooks"

import {
  clearFilter,
  selectFilterCount,
  selectSettings,
  updateFilterSettings,
  updateSettings,
} from "entities/test/model"

import { ClearFilters } from "features/filter"

import { useTestPlanContext } from "pages/project"

import CollapseIcon from "shared/assets/icons/arrows-in-simple.svg?react"
import { saveVisibleColumns } from "shared/libs"
import { Button, DataViewSelect } from "shared/ui"

import {
  TestsBulkAction,
  TestsButtonFilterDrawer,
  TestsSavedFilters,
  TestsSorter,
  TestsTreeContext,
} from "widgets/tests"

interface Props {
  testPlanId?: number
}

export const TestPlanDataActions = memo(({ testPlanId }: Props) => {
  const { t } = useTranslation(["translation", "entities"])
  const { tree: testsTree } = useContext(TestsTreeContext)!

  const { dataView, updateDataView } = useTestPlanContext()
  const dispatch = useAppDispatch()
  const tableSettings = useAppSelector(selectSettings<TestTableParams>("table"))
  const treeSettings = useAppSelector(selectSettings<BaseTreeParams>("tree"))
  const testsSelectedCount = useAppSelector(selectFilterCount)

  const isList = dataView === "list"
  const visibleColumns = isList ? tableSettings.visibleColumns : treeSettings.visibleColumns
  const columns = isList ? tableSettings.columns : treeSettings.columns

  const handleChangeVisibleColumns = (newVisibleColumns: ColumnParam[]) => {
    const key = isList ? "table" : "tree"
    dispatch(
      updateSettings({
        key,
        settings: {
          visibleColumns: newVisibleColumns,
        },
      })
    )
    saveVisibleColumns(`tests-visible-cols-${key}`, newVisibleColumns)
  }

  const resetSelectedTreeRows = () => {
    dispatch(
      updateSettings({
        key: "tree",
        settings: {
          isResetSelection: true,
        },
      })
    )
  }

  const resetSelectedTableRows = () => {
    dispatch(
      updateSettings({
        key: "table",
        settings: {
          isResetSelection: true,
        },
      })
    )
  }

  const resetAllSelectedRows = () => {
    resetSelectedTreeRows()
    resetSelectedTableRows()
  }

  const handleClearFilter = () => {
    dispatch(updateFilterSettings({ selected: null }))
    dispatch(clearFilter())
    resetAllSelectedRows()
  }

  return (
    <Flex justify="space-between" align="flex-end" style={{ width: "100%", marginBottom: 24 }}>
      <Flex vertical gap={16}>
        <Flex align="center" wrap gap={16}>
          <Typography.Title level={2} style={{ marginBottom: 0, textWrap: "nowrap" }}>
            {t("Tests")}
          </Typography.Title>
          <TestsBulkAction testPlanId={testPlanId} resetSelectedRows={resetAllSelectedRows} />
        </Flex>
      </Flex>
      <Flex gap={8} wrap justify="flex-end" align="center">
        <Flex gap={8} align="center">
          <ClearFilters isVisible={!!testsSelectedCount} onClear={handleClearFilter} />
          <TestsButtonFilterDrawer resetSelectedRows={resetAllSelectedRows} />
          <TestsSavedFilters resetSelectedRows={resetAllSelectedRows} />
          <TestsSorter />
        </Flex>
        {!isList && (
          <Tooltip title={t("Collapse All")}>
            <Button
              icon={<CollapseIcon width={18} height={18} color="var(--y-grey-35)" />}
              onClick={() => testsTree.current?.toggleAllRowsExpanded(false)}
              shape="square"
              color="secondary-linear"
              data-testid="test-plan-detail-action-collapse-all-button"
            />
          </Tooltip>
        )}
        <SettingsColumnVisibility
          id={isList ? "tests-table-setting-columns-btn" : "tests-tree-setting-columns-btn"}
          columns={columns}
          visibilityColumns={visibleColumns}
          onChange={handleChangeVisibleColumns}
        />
        <Divider type="vertical" style={{ height: "1.5em" }} />
        <DataViewSelect value={dataView} onChange={updateDataView} />
      </Flex>
    </Flex>
  )
})

TestPlanDataActions.displayName = "TestPlanDataActions"
