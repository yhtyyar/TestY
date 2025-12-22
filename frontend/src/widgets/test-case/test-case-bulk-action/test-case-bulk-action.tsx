import { Dropdown, Flex, MenuProps } from "antd"
import { useContext } from "react"
import { useTranslation } from "react-i18next"

import { useAppSelector } from "app/hooks"

import { useLazyGetTestSuiteAncestorsQuery, useLazyGetTestSuitesQuery } from "entities/suite/api"

import { useBulkTreeUpdateMutation, useBulkUpdateMutation } from "entities/test-case/api"
import { selectFilter, selectSettings } from "entities/test-case/model"

import { MoveEntity } from "features/common"
import { ChangeBulkLabel } from "features/label"

import { useProjectContext, useTestSuiteContext } from "pages/project"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import { useAntdModals } from "shared/hooks"
import { deleteEmptyParams } from "shared/libs"
import { Button } from "shared/ui"

import { TestCasesTreeContext } from "../test-cases-tree"
import styles from "./styles.module.css"

interface Props {
  testSuiteId?: number
  resetSelectedRows: () => void
}

export const TestCaseBulkAction = ({ testSuiteId, resetSelectedRows }: Props) => {
  const { t } = useTranslation(["translation", "entities"])
  const project = useProjectContext()
  const { antdNotification } = useAntdModals()
  const { dataView } = useTestSuiteContext()
  const { tree: testCasesTree } = useContext(TestCasesTreeContext)!

  const [getSuites] = useLazyGetTestSuitesQuery()
  const [getAncestors] = useLazyGetTestSuiteAncestorsQuery()

  const [bulkUpdateTableTestsCases, { isLoading: isLoadingBulkTable }] = useBulkUpdateMutation()
  const [bulkUpdateTreeTestsCases, { isLoading: isLoadingBulkTree }] = useBulkTreeUpdateMutation()
  const bulkUpdate = dataView === "list" ? bulkUpdateTableTestsCases : bulkUpdateTreeTestsCases

  const tableSettings = useAppSelector(selectSettings<TestCaseTableParams>("table"))
  const treeSettings = useAppSelector(selectSettings<BaseTreeParams>("tree"))
  const testCasesFilter = useAppSelector(selectFilter)

  const selectedTableCount = tableSettings.isAllSelected
    ? tableSettings.count - tableSettings.excludedRows.length
    : tableSettings.selectedRows.length

  const selectedCount = dataView === "list" ? selectedTableCount : treeSettings.selectedCount

  const prepareBulkRequestData = () => {
    const commonFilters: Partial<TestCaseGetFilters> = deleteEmptyParams({
      is_archive: testCasesFilter.is_archive,
      search: testCasesFilter.name_or_id,
      labels: testCasesFilter.labels,
      not_labels: testCasesFilter.not_labels,
      labels_condition: testCasesFilter.labels_condition,
      suite: testCasesFilter.suites,
      test_suite_created_before: testCasesFilter.test_suite_created_before,
      test_suite_created_after: testCasesFilter.test_suite_created_after,
      test_case_created_before: testCasesFilter.test_case_created_before,
      test_case_created_after: testCasesFilter.test_case_created_after,
    })

    const reqData: TestCaseBulkUpdate = {
      filter_conditions: commonFilters,
      included_suites: [] as number[],
      included_cases: [] as number[],
      excluded_cases: [] as number[],
      current_suite: testSuiteId ?? null,
      project: project.id,
    }

    if (dataView === "list") {
      if (tableSettings.isAllSelected) {
        reqData.excluded_cases = tableSettings.excludedRows
      } else {
        reqData.included_cases = tableSettings.selectedRows
      }
    } else {
      reqData.included_suites = treeSettings.selectedRows.map(Number)
      reqData.included_cases = treeSettings.selectedLeafRows.map(Number)
    }

    return reqData
  }

  const reinitTree = () => {
    if (testCasesTree.current) {
      testCasesTree.current.initRoot()
    }
    resetSelectedRows()
  }

  const handleMoveSubmit = async (selectedSuite: number, onLoading?: (toggle: boolean) => void) => {
    const reqData = prepareBulkRequestData()
    reqData.suite = selectedSuite
    onLoading?.(true)
    const result = await bulkUpdate(reqData)
    //@ts-ignore
    if (result.error) {
      //@ts-ignore
      throw new Error(result.error as unknown)
    }
    onLoading?.(false)
    antdNotification.success("move-test-cases", {
      description: t("entities:testCase.MoveSuccess"),
    })

    reinitTree()
  }

  const handleBulkAddLabel = async (
    labels: SelectedLabel[],
    operationType: ChangeLabelBulkOperationType
  ) => {
    const reqData = prepareBulkRequestData()
    reqData.labels = labels.map((i) => ({ id: i.value, name: i.label, color: i.color }))
    reqData.labels_action = operationType

    const result = await bulkUpdate(reqData)
    //@ts-ignore
    if (result.error) {
      //@ts-ignore
      throw new Error(result.error as unknown)
    }

    reinitTree()
  }

  const actionItems: MenuProps["items"] = [
    {
      key: "move",
      label: (
        <MoveEntity
          onSubmit={handleMoveSubmit}
          name="plan"
          id="cases"
          isLoading={isLoadingBulkTable || isLoadingBulkTree}
          title={t("Move cases to suite")}
          label={t("Parent suite")}
          placeholder={t("Search a test suite")}
          // @ts-ignore
          getEntities={getSuites}
          // @ts-ignore
          getAncestor={getAncestors}
        />
      ),
    },
    {
      key: "addLabel",
      label: <ChangeBulkLabel onSubmit={handleBulkAddLabel} selectedCount={selectedCount} />,
    },
  ]

  if (!selectedCount) {
    return null
  }

  return (
    <Flex gap={8} align="center">
      <Dropdown
        menu={{ items: actionItems }}
        trigger={["click"]}
        openClassName={styles.actionMenuButton}
      >
        <Button color="accent" style={{ gap: 4 }} id="test-cases-actions-dropdown">
          <span>{t("Actions")}</span>
          <ArrowIcon width={16} height={16} className={styles.actionMenuArrow} />
        </Button>
      </Dropdown>
      <div>
        <span style={{ marginRight: 4 }}>{t("Items Selected")}</span>
        <span data-testid="selected-tests-count">{selectedCount}</span>
      </div>
    </Flex>
  )
}
