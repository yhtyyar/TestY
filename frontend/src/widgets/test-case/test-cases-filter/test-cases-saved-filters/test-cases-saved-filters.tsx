import { Flex } from "antd"
import { useMeContext } from "processes"
import { useMemo } from "react"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { selectFilterSettings, updateFilter, updateFilterSettings } from "entities/test-case/model"
import { filterTestCaseSchema } from "entities/test-case/model/schemas"

import { SavedFilters } from "features/filter"

import { useProjectContext } from "pages/project"

import { schemaFillBySearchParams } from "shared/libs/sync-url"

export const TestCasesSavedFilters = () => {
  const project = useProjectContext()
  const { userConfig } = useMeContext()
  const dispatch = useAppDispatch()
  const testCasesSelectedFilter = useAppSelector(selectFilterSettings)
  const configFilters = userConfig?.test_suites?.filters?.[project.id]

  const handleChange = (value: string) => {
    const valueFilter = configFilters?.[value]
    const filterParse = schemaFillBySearchParams(filterTestCaseSchema, { url: valueFilter })
    dispatch(updateFilterSettings({ selected: value }))
    dispatch(updateFilter(filterParse as Record<string, unknown>))
  }

  const configFiltersKeys = useMemo(() => {
    if (!configFilters) {
      return []
    }

    return Object.keys(configFilters)
  }, [userConfig])

  if (!configFiltersKeys.length) {
    return null
  }

  return (
    <Flex align="center">
      <SavedFilters
        options={configFiltersKeys}
        value={testCasesSelectedFilter.selected}
        onChange={handleChange}
        hasUnsavedChanges={testCasesSelectedFilter.hasUnsavedChanges}
      />
    </Flex>
  )
}
