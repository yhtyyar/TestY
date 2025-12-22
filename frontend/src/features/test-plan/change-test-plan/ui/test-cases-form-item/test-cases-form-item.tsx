import { ColumnDef } from "@tanstack/react-table"
import { Flex, Form, Input, Switch, Typography } from "antd"
import { useMemo } from "react"
import { Control, Controller, UseFormWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { LabelFilter, LabelFilterCondition } from "entities/label/ui"

import { useTestCasesSearch } from "entities/test-case/model"

import { TestCaseLabels } from "features/test-plan/change-test-plan/ui/test-cases-form-item/ui/test-case-labels/test-case-labels"

import SearchIcon from "shared/assets/yi-icons/search.svg?react"
import { ArchivedTag, HighLighterTesty } from "shared/ui"
import { BaseTreeNodeProps, DataTree, TreeNode } from "shared/ui/tree"
import { objectToArrayOfString } from "shared/ui/tree/utils"

import { ChangeTestPlanForm, ErrorData } from "../../use-change-test-plan"
import styles from "./styles.module.css"

interface Props {
  errors: ErrorData | null
  control: Control<ChangeTestPlanForm>
  watch: UseFormWatch<ChangeTestPlanForm>
  type: "create" | "edit"
}

export const TestCasesFormItem = ({ errors, control, watch, type }: Props) => {
  const { t } = useTranslation()
  const {
    searchText,
    treeData,
    expandedRowKeys,
    isLoading: isLoadingTreeData,
    labelFilter,
    showArchived,
    onToggleArchived,
    onRowExpand,
    setSearchText,
    onChangeLabelFilter,
    onChangeLabelFilterCondition,
  } = useTestCasesSearch({ isShow: true })
  const selectedCount = objectToArrayOfString(watch("test_cases")).filter(
    (item: string) => !item.startsWith("TS")
  ).length

  const columns: ColumnDef<TreeNode<DataWithKey<SuiteWithCases>, BaseTreeNodeProps>>[] = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        cell: ({ row }) => {
          return (
            <Flex vertical>
              <Flex
                data-testid={`test-case-title-${row.original.title}`}
                gap={6}
                align="center"
                onClick={() => row.toggleSelected()}
                className={styles.treeRow}
              >
                {row.original.data?.is_archive && (
                  <ArchivedTag
                    data-testid={`test-case-archived-tag-${row.original.title}`}
                    size="sm"
                  />
                )}
                <HighLighterTesty searchWords={searchText} textToHighlight={row.original.title} />
              </Flex>
              {!!row.original.data.labels?.length && (
                <TestCaseLabels labels={row.original.data.labels} />
              )}
            </Flex>
          )
        },
        meta: {
          fullWidth: true,
        },
      },
    ],
    [searchText]
  )

  return (
    <Form.Item
      label={
        <Flex align="center" style={{ width: "100%", whiteSpace: "nowrap" }}>
          <span className={styles.fieldName} style={{ marginRight: 8 }}>
            {t("Test Cases")}
          </span>
          <span className={styles.selectedInfo}>
            {t("Selected")}:
            <span data-testid="create-test-plan-tree-selected" style={{ marginLeft: 4 }}>
              {selectedCount}
            </span>
          </span>
          <div style={{ width: "100%", height: 1, backgroundColor: "var(--y-color-border)" }} />
        </Flex>
      }
      labelCol={{ className: styles.labelWrapper }}
      validateStatus={errors?.test_cases ? "error" : ""}
      help={errors?.test_cases ? errors.test_cases : ""}
    >
      <div className={styles.form}>
        <div className={styles.row}>
          <Input
            placeholder={t("Search")}
            onChange={(e) => setSearchText(e.target.value)}
            value={searchText}
            data-testid="test-cases-filter-search"
            suffix={<SearchIcon width={16} height={16} style={{ transform: "scaleX(-1)" }} />}
            allowClear
            onClear={() => setSearchText("")}
          />
          <Switch
            defaultChecked
            className={styles.switcher}
            checked={showArchived}
            onChange={onToggleArchived}
            style={{ width: 40, margin: 0 }}
            data-testid="test-cases-filter-switcher-archived"
          />
          <Typography.Text>{t("Show Archived")}</Typography.Text>
        </div>
        <div className={styles.labelsFilter}>
          <LabelFilter value={labelFilter} onChange={onChangeLabelFilter} />
          <div className={styles.labelsCondition}>
            <LabelFilterCondition
              value={labelFilter.labels_condition}
              onChange={onChangeLabelFilterCondition}
              disabled={labelFilter.labels.length + labelFilter.not_labels.length < 2}
              styleBtn={{ height: 32 }}
            />
          </div>
        </div>
      </div>
      <Controller
        name="test_cases"
        control={control}
        render={({ field }) => (
          <DataTree
            data={treeData}
            columns={columns}
            isLoading={isLoadingTreeData}
            enableRowSelection
            getNodeId={(row) => row.id}
            state={{ rowSelection: field.value, expanded: expandedRowKeys }}
            styles={{ container: { height: 600 } }}
            onRowSelectionChange={field.onChange}
            onExpandedChange={onRowExpand}
            autoSelectParentIfAllSelected
            enableVirtualization
            data-testid={`${type}-test-cases-tree`}
          />
        )}
      />
    </Form.Item>
  )
}
