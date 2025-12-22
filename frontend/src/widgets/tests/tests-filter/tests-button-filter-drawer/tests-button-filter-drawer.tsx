import { SearchOutlined } from "@ant-design/icons"
import { Badge, DatePicker, Flex, Form, Input } from "antd"
import { Dayjs } from "dayjs"
import { StatusFilter } from "entities/status/ui"
import { useMeContext } from "processes"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useAppSelector } from "app/hooks"

import { LabelFilter, LabelFilterCondition, LabelFilterValue } from "entities/label/ui"

import {
  TestDataFilters,
  clearFilter,
  filterTestsSchema,
  resetFilterSettings,
  resetFormComplete,
  selectFilter,
  selectFilterCount,
  selectFilterSettings,
  selectShouldResetForm,
  testEmptyFilter,
  updateFilter,
  updateFilterSettings,
  updateOrdering,
} from "entities/test/model"

import {
  useLazyGetDescendantsTreeQuery,
  useLazyGetTestPlanSuitesQuery,
} from "entities/test-plan/api"

import { AssigneeFilter } from "entities/user/ui"

import { FilterControl } from "features/filter"

import { useProjectContext } from "pages/project"

import FilterPlusIcon from "shared/assets/yi-icons/filter-plus-min.svg?react"
import { useFilterDrawer } from "shared/hooks"
import { Button, Drawer, EntityTreeFilter, Toggle } from "shared/ui"

import styles from "./styles.module.css"

type DateFields =
  | "test_plan_started_after"
  | "test_plan_started_before"
  | "test_plan_created_after"
  | "test_plan_created_before"
  | "test_created_after"
  | "test_created_before"

interface Props {
  resetSelectedRows: () => void
}

export const TestsButtonFilterDrawer = ({ resetSelectedRows }: Props) => {
  const { t } = useTranslation(["translation", "entities"])

  const project = useProjectContext()
  const { me } = useMeContext()
  const { testPlanId } = useParams<ParamTestPlanId & ParamTestSuiteId>()

  const testsFilter = useAppSelector(selectFilter)
  const testsFilterSettings = useAppSelector(selectFilterSettings)
  const testsFilterCount = useAppSelector(selectFilterCount)
  const testsShouldResetForm = useAppSelector(selectShouldResetForm)

  const [getSuiteTree] = useLazyGetTestPlanSuitesQuery()
  const [getTestPlanTree] = useLazyGetDescendantsTreeQuery()

  const {
    isOpenFilter,
    form: { control, setValue, watch, getValues },
    triggerSubmit,
    handleOpenFilter,
    handleCloseFilter,
    handleClearFilter,
    getDateValue,
    handleUpdateFilterData,
    handleUpdateFilterSettings,
  } = useFilterDrawer<TestDataFilters>({
    filter: testsFilter,
    emptyFilter: testEmptyFilter,
    filterSettings: testsFilterSettings,
    shouldResetForm: testsShouldResetForm,
    onSubmitExtra: resetSelectedRows,
    actions: {
      updateFilter,
      clearFilter,
      resetFormComplete,
      updateOrdering,
      updateFilterSettings,
      resetFilterSettings,
    },
  })

  const isArchive = watch("is_archive")

  const handleSelectLabelCondition = (value: LabelCondition) => {
    setValue("labels_condition", value, { shouldDirty: true })
    triggerSubmit()
  }

  const handleAssigneeToMe = () => {
    if (!me) return
    const stateAssignee = getValues("assignee").filter((i) => i !== String(me.id))
    setValue("assignee", [String(me.id), ...stateAssignee], { shouldDirty: true })
    triggerSubmit()
  }

  const handleLabelsChange = (value: LabelFilterValue) => {
    setValue("labels", value.labels, { shouldDirty: true })
    setValue("not_labels", value.not_labels, { shouldDirty: true })
    setValue(
      "labels_condition",
      value.labels.length + value.not_labels.length < 2 ? undefined : value.labels_condition,
      { shouldDirty: true }
    )
    triggerSubmit()
  }

  const handleUpdateDate = (value: Dayjs | null, key: DateFields) => {
    if (key.includes("_after") && value === null) {
      setValue(key, undefined, { shouldDirty: true })
      setValue(key.replace("_after", "_before") as DateFields, undefined, {
        shouldDirty: true,
      })
    } else {
      setValue(key, value ? value.format("YYYY-MM-DD") : undefined, { shouldDirty: true })
    }

    triggerSubmit()
  }

  const handleShowArchiveChange = (toggle: boolean) => {
    setValue("is_archive", toggle ? toggle : undefined, { shouldDirty: true })
    triggerSubmit()
  }

  const getSuitesTreeData = () => {
    return getSuiteTree({
      parent: testPlanId ? Number(testPlanId) : null,
      project: project.id,
    }).unwrap()
  }

  const getPlansTreeData = () => {
    return getTestPlanTree({
      parent: testPlanId ? Number(testPlanId) : null,
      project: project.id,
    }).unwrap()
  }

  const getSuitesTreeDataFromRoot = () => {
    return getSuiteTree({ project: project.id, parent: null }).unwrap()
  }

  const getPlansTreeDataFromRoot = () => {
    return getTestPlanTree({ project: project.id, parent: null }).unwrap()
  }

  return (
    <>
      <Button
        id="btn-filter-tests"
        icon={<FilterPlusIcon width={18} height={18} />}
        onClick={handleOpenFilter}
        style={{ gap: 4, width: "fit-content" }}
        color="secondary-linear"
      >
        {t("Filter")}{" "}
        {!!testsFilterCount && (
          <Badge
            color="var(--y-color-accent)"
            count={testsFilterCount}
            data-testid="tests-button-filter-drawer-badge"
          />
        )}
      </Button>
      <Drawer
        id="tests-drawer-filter"
        header={
          <FilterControl
            type="plans"
            filterData={testsFilter as unknown as Record<string, unknown>}
            filterSchema={filterTestsSchema}
            filterSettings={testsFilterSettings}
            updateFilter={handleUpdateFilterData}
            updateSettings={handleUpdateFilterSettings}
            clearFilter={handleClearFilter}
          />
        }
        onClose={handleCloseFilter}
        isOpen={isOpenFilter}
        isLoading={false}
      >
        {isOpenFilter && (
          <Form onFinish={triggerSubmit} layout="vertical">
            <Form.Item
              label={t("Name or ID")}
              data-testid="tests-button-filter-drawer-name-or-id-label"
            >
              <Controller
                name="name_or_id"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t("Search")}
                    onBlur={triggerSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        triggerSubmit()
                      }
                    }}
                    onChange={(e) => field.onChange(e.target.value)}
                    suffix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
                    allowClear
                    data-testid="tests-button-filter-drawer-name-or-id-input"
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              label={t("Test Plan")}
              data-testid="tests-button-filter-drawer-test-plan-container"
            >
              <Controller
                name="plans"
                control={control}
                render={({ field }) => (
                  <EntityTreeFilter
                    getData={getPlansTreeData}
                    getDataFromRoot={getPlansTreeDataFromRoot}
                    type="plans"
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value)
                      triggerSubmit()
                    }}
                    onClear={() => {
                      field.onChange([])
                      triggerSubmit()
                    }}
                    treeWrapperId="test-filter-drawer-plans"
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              label={t("Test Suite")}
              data-testid="tests-button-filter-drawer-test-suite-container"
            >
              <Controller
                name="suites"
                control={control}
                render={({ field }) => (
                  <EntityTreeFilter
                    getData={getSuitesTreeData}
                    getDataFromRoot={getSuitesTreeDataFromRoot}
                    type="suites"
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value)
                      triggerSubmit()
                    }}
                    onClear={() => {
                      field.onChange([])
                      triggerSubmit()
                    }}
                    treeWrapperId="test-filter-drawer-suites"
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              label={t("Status")}
              data-testid="tests-button-filter-drawer-status-container"
            >
              <Controller
                name="statuses"
                control={control}
                render={({ field }) => (
                  <StatusFilter
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value)
                      triggerSubmit()
                    }}
                    onClear={() => {
                      field.onChange([])
                      triggerSubmit()
                    }}
                    data-testid="tests-button-filter-drawer-status-filter-select"
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              className={styles.formBetween}
              label={
                <div className={styles.formLabel}>
                  <span>{t("entities:user.Assignee")}</span>
                  <button
                    type="button"
                    className={styles.assigneeToMe}
                    onClick={handleAssigneeToMe}
                    data-testid="tests-button-filter-drawer-assignee-to-me"
                  >
                    {t("entities:user.AssignToMe")}
                  </button>
                </div>
              }
              data-testid="tests-button-filter-drawer-assignee-container"
            >
              <Controller
                name="assignee"
                control={control}
                render={({ field }) => (
                  <AssigneeFilter
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value)
                      triggerSubmit()
                    }}
                    onClear={() => {
                      field.onChange([])
                      triggerSubmit()
                    }}
                    project={project}
                    placeholder={t("Search a user")}
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              className={styles.formBetween}
              label={
                <div
                  className={styles.formLabel}
                  data-testid="tests-button-filter-drawer-labels-label"
                >
                  <span>{t("Label")}</span>
                  <LabelFilterCondition
                    value={getValues("labels_condition") ?? "and"}
                    onChange={handleSelectLabelCondition}
                    disabled={getValues("labels").length + getValues("not_labels").length < 2}
                  />
                </div>
              }
            >
              <Controller
                name="labels"
                control={control}
                render={() => (
                  <LabelFilter
                    value={{
                      labels: getValues("labels"),
                      not_labels: getValues("not_labels"),
                      labels_condition: getValues("labels_condition") ?? "and",
                    }}
                    onChange={handleLabelsChange}
                  />
                )}
              />
            </Form.Item>
            <Form.Item label={t("Test Plan Start Date")} style={{ width: "100%" }}>
              <Flex gap={16} style={{ width: "100%" }}>
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_plan_started_after")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_plan_started_after")}
                  disabled={false}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  maxDate={getDateValue("test_plan_started_before")}
                  allowClear
                  data-testid="tests-button-filter-drawer-test-plan-start-date-after"
                />
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_plan_started_before")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_plan_started_before")}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  disabled={!getValues("test_plan_started_after")}
                  minDate={getDateValue("test_plan_started_after")}
                  allowClear
                  data-testid="tests-button-filter-drawer-test-plan-start-date-before"
                />
              </Flex>
            </Form.Item>
            <Form.Item label={t("Test Plan Created At")} style={{ width: "100%" }}>
              <Flex gap={16} style={{ width: "100%" }}>
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_plan_created_after")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_plan_created_after")}
                  disabled={false}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  maxDate={getDateValue("test_plan_created_before")}
                  allowClear
                  data-testid="tests-button-filter-drawer-test-plan-created-at-after"
                />
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_plan_created_before")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_plan_created_before")}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  disabled={!getValues("test_plan_created_after")}
                  minDate={getDateValue("test_plan_created_after")}
                  allowClear
                  data-testid="tests-button-filter-drawer-test-plan-created-at-before"
                />
              </Flex>
            </Form.Item>
            <Form.Item label={t("Test Created At")} style={{ width: "100%" }}>
              <Flex gap={16} style={{ width: "100%" }}>
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_created_after")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_created_after")}
                  disabled={false}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  maxDate={getDateValue("test_created_before")}
                  allowClear
                  data-testid="tests-button-filter-drawer-test-created-at-after"
                />
                <DatePicker
                  onChange={(value) => handleUpdateDate(value, "test_created_before")}
                  style={{ width: "100%" }}
                  size="middle"
                  value={getDateValue("test_created_before")}
                  showTime={false}
                  format="YYYY-MM-DD"
                  picker="date"
                  placeholder="YYYY-MM-DD"
                  needConfirm={false}
                  disabled={!getValues("test_created_after")}
                  minDate={getDateValue("test_created_after")}
                  allowClear
                  data-testid="tests-button-filter-drawer-test-created-at-before"
                />
              </Flex>
            </Form.Item>
            <Form.Item>
              <Controller
                name="is_archive"
                control={control}
                render={() => (
                  <Toggle
                    id="archive-toggle"
                    label={t("Show Archived")}
                    labelFontSize={14}
                    checked={isArchive}
                    onChange={handleShowArchiveChange}
                    size="lg"
                  />
                )}
              />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </>
  )
}
