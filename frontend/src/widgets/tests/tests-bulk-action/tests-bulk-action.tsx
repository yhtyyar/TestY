import { Dropdown, Flex, MenuProps } from "antd"
import { useContext } from "react"
import { useTranslation } from "react-i18next"

import { useAppSelector } from "app/hooks"

import { useBulkTreeUpdateMutation, useBulkUpdateMutation } from "entities/test/api"
import { selectFilter, selectSettings } from "entities/test/model"

import { useLazyGetTestPlanAncestorsQuery, useLazyGetTestPlansQuery } from "entities/test-plan/api"

import { MoveEntity } from "features/common"
import { DeleteTests } from "features/test-plan/delete-tests/delete-tests"
import { AssignTestsBulk } from "features/test-result"
import { AddBulkResult } from "features/test-result/bulk-add-result/add-bulk-result"

import { useProjectContext, useTestPlanContext } from "pages/project"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import { NOT_ASSIGNED_FILTER_VALUE } from "shared/constants"
import { useAntdModals } from "shared/hooks"
import { deleteEmptyParams } from "shared/libs"
import { Button } from "shared/ui"

import { TestsTreeContext } from "../tests-tree"
import styles from "./styles.module.css"

const MAX_SELECTED_TESTS_FOR_ASYNC_BULK_ACTION = 1000

const getObjectFromFormField = (fields?: AddBulkResultCommonFormField[]) => {
  if (!fields) {
    return
  }

  const object: Record<string, string> = {}

  fields.forEach((field) => {
    if (field.value && field.label) {
      object[field.label] = field.value
    }
  })

  return object
}

const prepareSuiteSpecificFields = (
  specificFields?: AddBulkResultSuiteSpecificFormField[],
  bulkFields?: BulkSuiteSpecificFormField[],
  isBulk?: boolean
) => {
  if (!specificFields || (isBulk && !bulkFields)) {
    return
  }

  const preparedFields = isBulk
    ? specificFields.map(({ label, value, ...otherFields }) => ({
        ...otherFields,
        label,
        value: bulkFields?.find((bulkField) => bulkField.label === label)?.value ?? value,
      }))
    : specificFields

  const suiteIds = Array.from(new Set(preparedFields.map(({ suite_id }) => suite_id)))

  return suiteIds.map((suiteId) => {
    const fields = preparedFields.filter(({ suite_id }) => suiteId === suite_id)

    return {
      suite_id: suiteId,
      values: getObjectFromFormField(fields)!,
    }
  })
}

interface Props {
  testPlanId?: number
  resetSelectedRows: () => void
}

export const TestsBulkAction = ({ testPlanId, resetSelectedRows }: Props) => {
  const { t } = useTranslation(["translation", "entities"])
  const { antdNotification, antdModalConfirm } = useAntdModals()
  const project = useProjectContext()
  const { dataView } = useTestPlanContext()
  const { tree: testsTree } = useContext(TestsTreeContext)!

  const [bulkUpdateTableTests, { isLoading: isLoadingBulkTable }] = useBulkUpdateMutation()
  const [bulkUpdateTreeTests, { isLoading: isLoadingBulkTree }] = useBulkTreeUpdateMutation()
  const bulkUpdate = dataView === "list" ? bulkUpdateTableTests : bulkUpdateTreeTests

  const [getPlans] = useLazyGetTestPlansQuery()
  const [getAncestors] = useLazyGetTestPlanAncestorsQuery()

  const testsFilter = useAppSelector(selectFilter)
  const tableSettings = useAppSelector(selectSettings<TestTableParams>("table"))
  const treeSettings = useAppSelector(selectSettings<BaseTreeParams>("tree"))

  const selectedTableCount = tableSettings.isAllSelected
    ? tableSettings.count - tableSettings.excludedRows.length
    : tableSettings.selectedRows.length

  const selectedCount = dataView === "list" ? selectedTableCount : treeSettings.selectedCount

  const prepareBulkRequestData = () => {
    const commonFilters: Partial<TestGetFilters> = deleteEmptyParams({
      is_archive: testsFilter.is_archive,
      last_status: testsFilter.statuses,
      search: testsFilter.name_or_id,
      labels: testsFilter.labels,
      not_labels: testsFilter.not_labels,
      labels_condition: testsFilter.labels_condition,
      suite: testsFilter.suites,
      plan: testsFilter.plans,
      assignee: testsFilter.assignee.filter((user) => user !== NOT_ASSIGNED_FILTER_VALUE),
      unassigned: testsFilter.assignee?.includes(NOT_ASSIGNED_FILTER_VALUE) ? true : undefined,
      test_plan_started_before: testsFilter?.test_plan_started_before,
      test_plan_started_after: testsFilter?.test_plan_started_after,
      test_plan_created_before: testsFilter?.test_plan_created_before,
      test_plan_created_after: testsFilter?.test_plan_created_after,
      test_created_before: testsFilter?.test_created_before,
      test_created_after: testsFilter?.test_created_after,
    })

    const reqData: TestBulkUpdate = {
      // @ts-ignore // TODO fix equial param plan in TestBulkUpdate and TestGetFilters
      filter_conditions: commonFilters,
      included_tests: [] as number[],
      excluded_tests: [] as number[],
      included_plans: [] as number[],
      excluded_plans: [] as number[],
      current_plan: testPlanId ? Number(testPlanId) : undefined,
      project: project.id,
    }

    if (dataView === "list") {
      if (tableSettings.isAllSelected) {
        reqData.excluded_tests = tableSettings.excludedRows
      } else {
        reqData.included_tests = tableSettings.selectedRows
      }
    } else {
      reqData.included_plans = treeSettings.selectedRows
      reqData.included_tests = treeSettings.selectedLeafRows
    }

    return reqData
  }

  const reinitTree = () => {
    if (testsTree.current) {
      testsTree.current.initRoot()
    }
    resetSelectedRows()
  }

  const handleBulkResultSubmit = async (formData: AddBulkResultFormData) => {
    const reqData = prepareBulkRequestData()

    reqData.result = {
      comment: formData.comment,
      status: Number(formData.status),
      attachments: formData.attachments,
      attributes: {
        non_suite_specific: getObjectFromFormField(formData.non_suite_specific),
        suite_specific: prepareSuiteSpecificFields(
          formData.suite_specific,
          formData.bulk_suite_specific,
          formData.is_bulk_suite_specific
        ),
      },
    }

    const isAsync = selectedCount > MAX_SELECTED_TESTS_FOR_ASYNC_BULK_ACTION
    reqData.is_async = isAsync

    if (isAsync) {
      antdModalConfirm("async-operation-modal-confirm", {
        title: t("Async operation"),
        content: t(
          "Bulk operation for selected number of items would take some time and would be completed asynchronously. We will notify you about the completion. Please keep in mind that the other bulk operations would be unavailable till the end of this one."
        ),
        cancelButtonProps: { style: { display: "none" } },
      })
    }

    const result = await bulkUpdate(reqData)
    // @ts-ignore
    if (result.error) {
      //@ts-ignore
      throw new Error(result.error as unknown)
    }

    reinitTree()
  }

  const handleBulkAssignSubmit = async (assignee: string | null) => {
    const reqData = prepareBulkRequestData()
    reqData.assignee_id = assignee ? Number(assignee) : null
    const result = await bulkUpdate(reqData)
    // @ts-ignore
    if (result.error) {
      //@ts-ignore
      throw new Error(result.error as unknown)
    }

    reinitTree()
  }

  const handleMoveSubmit = async (plan: number, onLoading?: (toggle: boolean) => void) => {
    const reqData = prepareBulkRequestData()
    reqData.plan_id = plan
    onLoading?.(true)
    const result = await bulkUpdate(reqData)
    //@ts-ignore
    if (result.error) {
      //@ts-ignore
      throw new Error(result.error as unknown)
    }
    onLoading?.(false)
    antdNotification.success("move-tests", {
      description: t("entities:test.MoveSuccess"),
    })

    reinitTree()
  }

  const handleDeleteTests = async () => {
    const reqData = prepareBulkRequestData()

    reqData.is_deleted = true

    await bulkUpdate(reqData).unwrap()

    reinitTree()
  }

  const actionItems: MenuProps["items"] = [
    {
      key: "move",
      label: (
        <MoveEntity
          onSubmit={handleMoveSubmit}
          name="plan"
          id="tests"
          isLoading={isLoadingBulkTable || isLoadingBulkTree}
          title={t("Move test to plan")}
          label={t("Parent plan")}
          placeholder={t("Search a test plan")}
          // @ts-ignore
          getEntities={getPlans}
          // @ts-ignore
          getAncestor={getAncestors}
        />
      ),
    },
    {
      key: "assign",
      label: (
        <AssignTestsBulk
          onSubmit={handleBulkAssignSubmit}
          isLoading={isLoadingBulkTable || isLoadingBulkTree}
        />
      ),
    },
    {
      key: "addResult",
      label: (
        <AddBulkResult
          onSubmit={handleBulkResultSubmit}
          selectedCount={selectedCount}
          getBulkRequestData={prepareBulkRequestData}
        />
      ),
    },
    {
      key: "deleteTests",
      label: <DeleteTests onSubmit={handleDeleteTests} count={selectedCount} />,
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
        <Button color="accent" style={{ gap: 4 }} id="tests-actions-dropdown">
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
