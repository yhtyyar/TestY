import { PayloadAction, createAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"
import { orderingSchema } from "app/zod-common.schema"

import { schemaFillBySearchParams, schemaFillUndefined } from "shared/libs/sync-url"

import { TestDataFilters, filterTestsSchema } from "./schemas"
import { FilterSettings, TestStateFilters } from "./test-filter-slice.types"

export const testEmptyFilter = schemaFillUndefined(filterTestsSchema)
const initOrdering = schemaFillBySearchParams(orderingSchema)
const initFilter = schemaFillBySearchParams(filterTestsSchema)

const initialState: TestStateFilters = {
  filter: {
    name_or_id: initFilter.name_or_id,
    plans: initFilter.plans,
    suites: initFilter.suites,
    statuses: initFilter.statuses,
    assignee: initFilter.assignee,
    labels: initFilter.labels,
    not_labels: initFilter.not_labels,
    labels_condition: initFilter.labels_condition,
    is_archive: initFilter.is_archive,
    test_plan_started_before: initFilter.test_plan_started_before,
    test_plan_started_after: initFilter.test_plan_started_after,
    test_plan_created_before: initFilter.test_plan_created_before,
    test_plan_created_after: initFilter.test_plan_created_after,
    test_created_before: initFilter.test_created_before,
    test_created_after: initFilter.test_created_after,
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

export const updateFilter = createAction<Partial<TestStateFilters["filter"]>>(
  "testsFilter/updateFilter"
)

export const clearFilter = createAction("testsFilter/clearFilter")

export const testsfilterSlice = createSlice({
  name: "testsFilter",
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
    updateOrdering: (state, action: PayloadAction<Partial<TestStateFilters["ordering"]>>) => {
      state.ordering = action.payload
    },
    resetFormComplete: (state) => {
      state.shouldResetForm = false
    },
    reinitializeFilter: (state) => {
      state.filter = schemaFillBySearchParams(filterTestsSchema)
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
      state.filter = testEmptyFilter
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
} = testsfilterSlice.actions

export const selectFilter = (state: RootState) => state.testsFilter.filter
export const selectFilterCount = (state: RootState) => {
  return Object.entries(state.testsFilter.filter).reduce((count, [key, value]) => {
    const defaultValue = testEmptyFilter[key as keyof TestDataFilters]

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
export const selectFilterSettings = (state: RootState) => state.testsFilter.settings
export const selectOrdering = (state: RootState) => state.testsFilter.ordering
export const selectShouldResetForm = (state: RootState) => state.testsFilter.shouldResetForm

export const testsfilterReducer = testsfilterSlice.reducer
