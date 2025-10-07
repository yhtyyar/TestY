import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"
import { paginationSchema } from "app/zod-common.schema"

import { DATA_VIEW_KEY } from "shared/constants"
import { getDataFromUrlOrLocalStorage, getVisibleColumns } from "shared/libs"
import { schemaFillBySearchParams } from "shared/libs/sync-url"

import { DATA_VIEW_TEST_CASE_LS_KEY } from "./constansts"
import { updateFilter } from "./filter-slice"

const baseTableColumns: ColumnParam[] = [
  {
    key: "id",
    title: "ID",
  },
  {
    key: "name",
    title: "Name",
    canHide: false,
  },
  {
    key: "suite_path",
    title: "Test Suite",
  },
  {
    key: "labels",
    title: "Labels",
  },
  {
    key: "estimate",
    title: "Estimate",
  },
  {
    key: "created_at",
    title: "Created At",
  },
]

const baseTreeColumns: ColumnParam[] = [
  {
    key: "name",
    title: "Name",
    canHide: false,
  },
  {
    key: "id",
    title: "ID",
  },
  {
    key: "labels",
    title: "Labels",
  },
  {
    key: "estimate",
    title: "Estimate",
  },
  {
    key: "created_at",
    title: "Created At",
  },
]

const initPagination = schemaFillBySearchParams(paginationSchema)

const initialState: TestCaseState = {
  drawerTestCase: null,
  editingTestCase: null,
  test: null,
  dataView: getDataFromUrlOrLocalStorage<EntityView>(
    DATA_VIEW_KEY,
    DATA_VIEW_TEST_CASE_LS_KEY,
    "tree"
  ),
  settings: {
    table: {
      columns: baseTableColumns,
      testSuiteId: null,
      visibleColumns: getVisibleColumns("test-cases-visible-cols-table") ?? baseTableColumns,
      page: initPagination.page,
      page_size: initPagination.page_size,
      isAllSelected: false,
      selectedRows: [],
      excludedRows: [],
      count: 0,
      isResetSelection: false,
      _n: 0,
    },
    tree: {
      columns: baseTreeColumns,
      visibleColumns: getVisibleColumns("test-cases-visible-cols-tree") ?? baseTreeColumns,
    },
  },
}

export const testCaseSlice = createSlice({
  name: "testCase",
  initialState,
  reducers: {
    setDrawerTestCase: (state, action: PayloadAction<TestCase | null>) => {
      state.drawerTestCase = action.payload
    },
    setDrawerTestCaseIsArchive: (state, action: PayloadAction<boolean>) => {
      if (state.drawerTestCase) {
        state.drawerTestCase = { ...state.drawerTestCase, is_archive: action.payload }
      }
    },
    clearDrawerTestCase: (state) => {
      state.drawerTestCase = null
    },
    updateSettings: (state, action: PayloadAction<UpdateTestCaseSettings>) => {
      const newState = {
        ...state.settings[action.payload.key],
        ...action.payload.settings,
      }

      // @ts-ignore
      state.settings[action.payload.key] = newState
    },
    setPagination: (state, action: PayloadAction<SetPagination>) => {
      // @ts-ignore
      state.settings[action.payload.key] = {
        ...state.settings[action.payload.key],
        page: action.payload.pagination.page,
        page_size: action.payload.pagination.page_size,
      }
    },
    clearSettings: (state) => {
      state.settings = {
        tree: initialState.settings.tree,
        table: {
          ...initialState.settings.table,
          page: 1,
          page_size: 10,
        },
      }
    },
    setDataView: (state, action: PayloadAction<EntityView>) => {
      localStorage.setItem(DATA_VIEW_TEST_CASE_LS_KEY, action.payload)
      state.dataView = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(updateFilter, (state) => {
      state.settings.table.page = 1
    })
  },
})

export const {
  setDrawerTestCase,
  clearDrawerTestCase,
  setDrawerTestCaseIsArchive,
  updateSettings,
  clearSettings,
  setPagination,
  setDataView,
} = testCaseSlice.actions

export const testCaseReducer = testCaseSlice.reducer

export const selectSettings =
  <T>(settingsKey: keyof TestState["settings"]) =>
  (state: RootState): T =>
    state.testCase.settings[settingsKey] as T
export const selectDrawerTestCase = (state: RootState) => state.testCase.drawerTestCase
export const selectDataView = (state: RootState) => state.testCase.dataView
