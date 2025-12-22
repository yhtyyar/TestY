import { Flex } from "antd"
import { useMeContext } from "processes"
import { useTranslation } from "react-i18next"
import { ZodObject } from "zod"

import { FilterSettings } from "entities/test/model/test-filter-slice.types"

import { useProjectContext } from "pages/project"

import { useAntdModals } from "shared/hooks"
import { schemaFillBySearchParams } from "shared/libs/sync-url"

import styles from "./styles.module.css"
import { ActionButtonsFilter } from "./ui/action-buttons-filter/action-buttons-filter"
import { SelectFilter } from "./ui/select-filter/select-filter"

interface Props {
  type: "plans" | "suites"
  filterData: Record<string, unknown>
  filterSchema: ZodObject
  filterSettings: FilterSettings
  updateFilter: (filter: Record<string, unknown>) => void
  updateSettings: (settings: Partial<FilterSettings>) => void
  clearFilter: () => void
}

export const FilterControl = ({
  type,
  filterData,
  filterSchema,
  filterSettings,
  updateFilter,
  updateSettings,
  clearFilter,
}: Props) => {
  const { t } = useTranslation()
  const { antdNotification, antdModalConfirm } = useAntdModals()

  const { userConfig, updateConfig } = useMeContext()
  const project = useProjectContext()

  const configFilters =
    type === "plans"
      ? userConfig?.test_plans?.filters?.[project.id]
      : userConfig?.test_suites?.filters?.[project.id]

  const handleDelete = (name: string) => {
    antdModalConfirm("delete-filter", {
      title: t("Do you want to delete this filter?"),
      okText: t("Delete"),
      onOk: async () => {
        const filtersData = { ...(configFilters ?? {}) }
        delete filtersData[name]

        const typeKey = type === "plans" ? "test_plans" : "test_suites"
        await updateConfig({
          ...userConfig,
          [typeKey]: {
            ...userConfig?.[typeKey],
            filters: {
              ...(userConfig?.[typeKey]?.filters ?? {}),
              [project.id]: {
                ...filtersData,
              },
            },
          },
        })

        if (filterSettings.selected === name) {
          updateSettings({ selected: null })
          clearFilter()
        }

        antdNotification.success("delete-filter", {
          description: t("Filter deleted successfully"),
        })
      },
    })
  }

  const handleSelect = (name: string) => {
    const value = configFilters?.[name]
    const filterParse = schemaFillBySearchParams(filterSchema, { url: value })
    updateFilter(filterParse)
  }

  const handleResetToSelected = () => {
    if (!filterSettings.selected) {
      return
    }
    const value = configFilters?.[filterSettings.selected]
    const filterParse = schemaFillBySearchParams(filterSchema, { url: value })
    updateFilter(filterParse)
  }

  return (
    <Flex vertical justify="space-between">
      <Flex align="center" justify="space-between">
        <SelectFilter
          type={type}
          filterData={filterData}
          filterSettings={filterSettings}
          configFilters={configFilters}
          filterSchema={filterSchema}
          onDelete={handleDelete}
          onSelect={handleSelect}
          updateSettings={updateSettings}
        />
        <ActionButtonsFilter
          type={type}
          filterData={filterData}
          filterSettings={filterSettings}
          onDelete={handleDelete}
          updateSettings={updateSettings}
          resetFilterToSelected={handleResetToSelected}
          clearFilter={clearFilter}
        />
      </Flex>
      {filterSettings.hasUnsavedChanges && (
        <span className={styles.unsaved} data-testid="select-filter-unsaved-changes">
          {t("Unsaved Changes")}
        </span>
      )}
    </Flex>
  )
}
