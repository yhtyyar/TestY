import { PayloadAction, createSlice } from "@reduxjs/toolkit"

import { RootState } from "app/store"
import { paginationSchema } from "app/zod-common.schema"

import { DATA_VIEW_KEY } from "shared/constants"
import { getDataFromUrlOrLocalStorage, getVisibleColumns } from "shared/libs"
import { schemaFillBySearchParams } from "shared/libs/sync-url"

import { DATA_VIEW_TESTS_LS_KEY } from "./constansts"
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
    key: "plan_path",
    title: "Test Plan",
  },
  {
    key: "suite_path",
    title: "Test Suite",
  },
  {
    key: "estimate",
    title: "Estimate",
  },
  {
    key: "labels",
    title: "Labels",
  },
  {
    key: "last_status",
    title: "Last status",
  },
  {
    key: "assignee_username",
    title: "Assignee",
  },
  {
    title: "Created At",
    key: "created_at",
  },
]

const baseTreeColumns: ColumnParam[] = [
  {
    key: "name",
    title: "Name",
    canHide: false,
  },
  {
    key: "last_status",
    title: "Last status",
  },
  {
    key: "id",
    title: "ID",
  },
  {
    key: "suite_path",
    title: "Test Suite",
  },
  {
    key: "assignee_username",
    title: "Assignee",
  },
  {
    key: "estimate",
    title: "Estimate",
  },
  {
    key: "labels",
    title: "Labels",
  },
  {
    key: "started_at",
    title: "Start Date",
  },
  {
    key: "created_at",
    title: "Created At",
  },
]

const initPagination = schemaFillBySearchParams(paginationSchema)

const initialState: TestState = {
  test: null,
  dataView: getDataFromUrlOrLocalStorage<EntityView>(DATA_VIEW_KEY, DATA_VIEW_TESTS_LS_KEY, "tree"),
  drawer: {
    view: "test",
    shouldClose: false,
  },
  settings: {
    table: {
      testPlanId: null,
      columns: baseTableColumns,
      visibleColumns: getVisibleColumns("tests-visible-cols-table") ?? baseTableColumns,
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
      visibleColumns: getVisibleColumns("tests-visible-cols-tree") ?? baseTreeColumns,
      selectedRows: [],
      selectedLeafRows: [],
      selectedCount: 0,
      isResetSelection: false,
    },
  },
}

export const testSlice = createSlice({
  name: "test",
  initialState,
  reducers: {
    setDrawerTest: (state, action: PayloadAction<Test | null>) => {
      state.test = action.payload
    },
    setDrawerView: (state, action: PayloadAction<DrawerData>) => {
      state.drawer = action.payload
    },
    updateSettings: (state, action: PayloadAction<UpdateTestSettings>) => {
      // @ts-ignore
      state.settings[action.payload.key] = {
        ...state.settings[action.payload.key],
        ...action.payload.settings,
      }
    },
    setSettings: (state, action: PayloadAction<SetSettings>) => {
      // @ts-ignore
      state.settings[action.payload.key] = action.payload
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
      localStorage.setItem(DATA_VIEW_TESTS_LS_KEY, action.payload)
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
  setDrawerTest,
  setDrawerView,
  updateSettings,
  setSettings,
  setPagination,
  clearSettings,
  setDataView,
} = testSlice.actions

export const selectDrawerTest = (state: RootState) => state.test.test
export const selectDataView = (state: RootState) => state.test.dataView
export const selectDrawerData = (state: RootState) => state.test.drawer
export const selectSettings =
  <T>(settingsKey: keyof TestState["settings"]) =>
  (state: RootState): T =>
    state.test.settings[settingsKey] as T

export const testReducer = testSlice.reducer
