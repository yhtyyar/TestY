import { Divider, Flex, Tooltip, Typography } from "antd"
import { memo, useContext } from "react"
import { useTranslation } from "react-i18next"

import { useAppDispatch, useAppSelector } from "app/hooks"

import {
  clearFilter,
  selectFilterCount,
  selectSettings,
  updateFilterSettings,
  updateSettings,
} from "entities/test-case/model"

import { ClearFilters } from "features/filter"
import { CreateTestCase } from "features/test-case"

import { useTestSuiteContext } from "pages/project"

import CollapseIcon from "shared/assets/icons/arrows-in-simple.svg?react"
import { saveVisibleColumns } from "shared/libs"
import { Button, DataViewSelect } from "shared/ui"

import { SettingsColumnVisibility } from "widgets/settings-column-visibility/settings-column-visibility"
import {
  TestCaseBulkAction,
  TestCasesButtonFilterDrawer,
  TestCasesSavedFilters,
  TestCasesSorter,
  TestCasesTreeContext,
} from "widgets/test-case"

interface Props {
  suite?: Suite
  isFetching: boolean
}

export const TestSuiteDataActions = memo(({ suite, isFetching }: Props) => {
  const { t } = useTranslation(["translation", "entities"])
  const { tree: testCasesTree } = useContext(TestCasesTreeContext)!
  const { dataView, updateDataView } = useTestSuiteContext()

  const dispatch = useAppDispatch()
  const tableSettings = useAppSelector(selectSettings<TestCaseTableParams>("table"))
  const treeSettings = useAppSelector(selectSettings<BaseTreeParams>("tree"))
  const testCasesSelectedCount = useAppSelector(selectFilterCount)

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
    saveVisibleColumns(`test-cases-visible-cols-${key}`, newVisibleColumns)
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

  const resetSelectedTreeRows = () => {
    dispatch(
      updateSettings({
        key: "tree",
        settings: {
          isResetSelection: true,
          selectedLeafRows: [],
          selectedRows: [],
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
  }

  return (
    <Flex justify="space-between" align="center" style={{ width: "100%", marginBottom: 24 }}>
      <Flex gap={16} align="center">
        <Typography.Title
          level={2}
          style={{ marginBottom: 0, alignSelf: "center", textWrap: "nowrap" }}
        >
          {t("Test Cases")}
        </Typography.Title>
        <CreateTestCase parentSuite={suite} loading={isFetching} />
        <TestCaseBulkAction testSuiteId={suite?.id} resetSelectedRows={resetAllSelectedRows} />
      </Flex>
      <Flex gap={8} wrap justify="flex-end" align="center">
        <Flex gap={8} align="center">
          <ClearFilters isVisible={!!testCasesSelectedCount} onClear={handleClearFilter} />
          <TestCasesButtonFilterDrawer />
          <TestCasesSavedFilters />
          <TestCasesSorter />
        </Flex>
        {!isList && (
          <Tooltip title={t("Collapse All")}>
            <Button
              icon={<CollapseIcon width={18} height={18} color="var(--y-grey-35)" />}
              onClick={() => testCasesTree.current?.toggleAllRowsExpanded(false)}
              shape="square"
              color="secondary-linear"
              data-testid="test-cases-collapse-all-btn"
            />
          </Tooltip>
        )}
        <SettingsColumnVisibility
          id={
            isList ? "test-cases-table-setting-columns-btn" : "test-cases-tree-setting-columns-btn"
          }
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

TestSuiteDataActions.displayName = "TestSuiteDataAction"
