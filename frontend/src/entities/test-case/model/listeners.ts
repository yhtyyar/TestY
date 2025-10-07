import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { PathPattern } from "react-router-dom"

import { orderingSchema, paginationSchema } from "app/zod-common.schema"

import { registerSync } from "shared/libs/sync-url"

import { clearFilter, reinitializeFilter, updateFilter, updateOrdering } from "./filter-slice"
import { dataViewTestsSchema, filterTestCaseSchema } from "./schemas"
import { setDataView, setPagination, updateSettings } from "./slice"

export const testCasesUrlSyncMiddleware = createListenerMiddleware()
const ALLOWED_ROUTES: PathPattern<string>[] = [
  { path: "/projects/:projectId/suites" },
  { path: "/projects/:projectId/suites/:suiteId" },
]
const DISALLOWED_ROUTES: PathPattern<string>[] = [
  { path: "/projects/:projectId/suites/new-test-case" },
  { path: "/projects/:projectId/suites/edit-test-case" },
  { path: "/projects/:projectId/suites/edit-test-suite" },
  { path: "/projects/:projectId/suites/new-test-suite" },
]

// pagination
registerSync({
  middleware: testCasesUrlSyncMiddleware,
  matcher: isAnyOf(setPagination, updateSettings),
  schema: paginationSchema,
  slicePath: "testCase.settings.table",
  allowedRoutes: ALLOWED_ROUTES,
  disAllowedRoutes: DISALLOWED_ROUTES,
  effectUrlToState: (validated, dispatch) => {
    dispatch(setPagination({ key: "table", pagination: validated }))
  },
})

// ordering
registerSync({
  middleware: testCasesUrlSyncMiddleware,
  matcher: isAnyOf(updateOrdering),
  schema: orderingSchema,
  slicePath: "testCasesFilter",
  allowedRoutes: ALLOWED_ROUTES,
  disAllowedRoutes: DISALLOWED_ROUTES,
  effectUrlToState: (validated, dispatch) => {
    if (validated.ordering) {
      dispatch(updateOrdering(validated.ordering))
    }
  },
})

// dataView
registerSync({
  middleware: testCasesUrlSyncMiddleware,
  matcher: isAnyOf(setDataView),
  schema: dataViewTestsSchema,
  slicePath: "testCase",
  allowedRoutes: ALLOWED_ROUTES,
  disAllowedRoutes: DISALLOWED_ROUTES,
  effectUrlToState: (validated, dispatch) => {
    dispatch(setDataView(validated.dataView))
  },
})

// filters
registerSync({
  middleware: testCasesUrlSyncMiddleware,
  matcher: isAnyOf(updateFilter, clearFilter, reinitializeFilter),
  schema: filterTestCaseSchema,
  slicePath: "testCasesFilter.filter",
  allowedRoutes: ALLOWED_ROUTES,
  disAllowedRoutes: DISALLOWED_ROUTES,
  effectUrlToState: (validated, dispatch) => {
    dispatch(updateFilter(validated))
  },
})
