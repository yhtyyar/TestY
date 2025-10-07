import { PayloadAction, createAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"
import { orderingSchema } from "app/zod-common.schema"

import { FilterSettings } from "entities/test/model/test-filter-slice.types"

import { schemaFillBySearchParams, schemaFillUndefined } from "shared/libs/sync-url"

import { TestCaseDataFilters, filterTestCaseSchema } from "./schemas"
import { TestCaseStateFilters } from "./test-case-filter-slice.types"

export const testCasesEmptyFilter = schemaFillUndefined(filterTestCaseSchema)
const initOrdering = schemaFillBySearchParams(orderingSchema)
const initFilter = schemaFillBySearchParams(filterTestCaseSchema)

const initialState: TestCaseStateFilters = {
  filter: {
    name_or_id: initFilter.name_or_id,
    suites: initFilter.suites,
    is_archive: initFilter.is_archive,
    labels: initFilter.labels,
    not_labels: initFilter.not_labels,
    labels_condition: initFilter.labels_condition,
    test_suite_created_before: initFilter.test_suite_created_before,
    test_suite_created_after: initFilter.test_suite_created_after,
    test_case_created_before: initFilter.test_case_created_before,
    test_case_created_after: initFilter.test_case_created_after,
  },
  settings: {
    filterProjectId: null,
    selected: null,
    editing: false,
    editingValue: "",
    creatingNew: false,
    hasUnsavedChanges: false,
  },
  ordering: initOrdering.ordering,
  shouldResetForm: false,
}

export const updateFilter = createAction<Partial<TestCaseStateFilters["filter"]>>(
  "testCasesFilter/updateFilter"
)

export const clearFilter = createAction("testCasesFilter/clearFilter")

export const testCasesfilterSlice = createSlice({
  name: "testCasesFilter",
  initialState,
  reducers: {
    updateFilterSettings: (state, action: PayloadAction<Partial<FilterSettings>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      }
    },
    resetFilterSettings: (state) => {
      state.settings = initialState.settings
    },
    updateOrdering: (state, action: PayloadAction<Partial<TestCaseStateFilters["ordering"]>>) => {
      state.ordering = action.payload
    },
    resetFormComplete: (state) => {
      state.shouldResetForm = false
    },
    reinitializeFilter: (state) => {
      state.filter = schemaFillBySearchParams(filterTestCaseSchema)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(updateFilter, (state, action) => {
      state.filter = {
        ...state.filter,
        ...action.payload,
      }
    })
    builder.addCase(clearFilter, (state) => {
      state.filter = testCasesEmptyFilter
      state.shouldResetForm = true
    })
  },
})

export const {
  updateFilterSettings,
  updateOrdering,
  resetFilterSettings,
  resetFormComplete,
  reinitializeFilter,
} = testCasesfilterSlice.actions

export const selectFilter = (state: RootState) => state.testCasesFilter.filter
export const selectFilterSettings = (state: RootState) => state.testCasesFilter.settings
export const selectFilterCount = (state: RootState) => {
  return Object.entries(state.testCasesFilter.filter).reduce((count, [key, value]) => {
    const defaultValue = testCasesEmptyFilter[key as keyof TestCaseDataFilters]

    if (Array.isArray(value)) {
      if (value.length > 0) {
        return count + 1
      }
    } else if (value !== defaultValue) {
      return count + 1
    }

    return count
  }, 0)
}
export const selectOrdering = (state: RootState) => state.testCasesFilter.ordering
export const selectShouldResetForm = (state: RootState) => state.testCasesFilter.shouldResetForm

export const testCasesfilterReducer = testCasesfilterSlice.reducer
