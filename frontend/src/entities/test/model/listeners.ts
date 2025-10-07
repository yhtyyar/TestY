import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { PathPattern } from "react-router-dom"

import { orderingSchema, paginationSchema } from "app/zod-common.schema"

import { registerSync } from "shared/libs/sync-url"

import { clearFilter, reinitializeFilter, updateFilter, updateOrdering } from "./filter-slice"
import { dataViewTestsSchema, filterTestsSchema } from "./schemas"
import { setDataView, setPagination, setSettings, updateSettings } from "./slice"

export const testsUrlSyncMiddleware = createListenerMiddleware()
const ALLOWED_ROUTES: PathPattern<string>[] = [
  { path: "/projects/:projectId/plans" },
  { path: "/projects/:projectId/plans/:planId" },
]
const DISALLOWED_ROUTES: PathPattern<string>[] = [
  { path: "/projects/:projectId/plans/:planId/edit-test-plan" },
  { path: "/projects/:projectId/plans/new-test-plan" },
]

// pagination
registerSync({
  middleware: testsUrlSyncMiddleware,
  matcher: isAnyOf(setPagination, setSettings, updateSettings),
  schema: paginationSchema,
  slicePath: "test.settings.table",
  allowedRoutes: ALLOWED_ROUTES,
  disAllowedRoutes: DISALLOWED_ROUTES,
  effectUrlToState: (validated, dispatch) => {
    dispatch(setPagination({ key: "table", pagination: validated }))
  },
})

// ordering
registerSync({
  middleware: testsUrlSyncMiddleware,
  matcher: isAnyOf(updateOrdering),
  schema: orderingSchema,
  slicePath: "testsFilter",
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
  middleware: testsUrlSyncMiddleware,
  matcher: isAnyOf(setDataView),
  schema: dataViewTestsSchema,
  slicePath: "test",
  allowedRoutes: ALLOWED_ROUTES,
  disAllowedRoutes: DISALLOWED_ROUTES,
  effectUrlToState: (validated, dispatch) => {
    dispatch(setDataView(validated.dataView))
  },
})

// filters
registerSync({
  middleware: testsUrlSyncMiddleware,
  matcher: isAnyOf(updateFilter, clearFilter, reinitializeFilter),
  schema: filterTestsSchema,
  slicePath: "testsFilter.filter",
  allowedRoutes: ALLOWED_ROUTES,
  disAllowedRoutes: DISALLOWED_ROUTES,
  effectUrlToState: (validated, dispatch) => {
    dispatch(updateFilter(validated))
  },
})
