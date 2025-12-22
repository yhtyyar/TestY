import { createApi } from "@reduxjs/toolkit/dist/query/react"
import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query"

import { baseQueryWithLogout } from "app/apiSlice"

import { labelInvalidate } from "entities/label/api"

import { suiteInvalidate } from "entities/suite/api"

import { systemStatsInvalidate } from "entities/system/api"

import { testInvalidate } from "entities/test/api"

import { testPlanLabelsInvalidate, testPlanTestsInvalidate } from "entities/test-plan/api"

import { updateVersionEvent } from "shared/events/update-version-event"
import { providesList } from "shared/libs"

import { setDrawerTestCase, setDrawerTestCaseIsArchive } from "../model"

const rootPath = "cases"

export const testCaseApi = createApi({
  reducerPath: "testCaseApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["TestCase", "TestCaseHistoryChanges", "TestCaseTestsList", "TestSuiteTestCases"],
  endpoints: (builder) => ({
    searchTestCases: builder.query<SuiteWithCases[], SearchTestCasesQuery>({
      query: (params) => ({
        url: `${rootPath}/search/`,
        params,
      }),
    }),
    createTestCase: builder.mutation<TestCase, TestCaseCreate>({
      query: (body) => ({
        url: `${rootPath}/`,
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(labelInvalidate)
        dispatch(testPlanLabelsInvalidate)
        dispatch(suiteInvalidate())
        dispatch(systemStatsInvalidate)
        dispatch(testSuiteTestCasesInvalidate)
      },
      invalidatesTags: [{ type: "TestCase", id: "LIST" }],
    }),
    deleteTestCase: builder.mutation<void, number>({
      query: (testCaseId) => ({
        url: `${rootPath}/${testCaseId}/`,
        method: "DELETE",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(labelInvalidate)
        dispatch(testPlanLabelsInvalidate)
        dispatch(suiteInvalidate())
        dispatch(systemStatsInvalidate)
        dispatch(testPlanTestsInvalidate)
        dispatch(testInvalidate)
        dispatch(testSuiteTestCasesInvalidate)
      },
      invalidatesTags: [
        { type: "TestCase", id: "LIST" },
        { type: "TestSuiteTestCases", id: "LIST" },
      ],
    }),
    updateTestCase: builder.mutation<TestCase, TestCaseUpdate>({
      query: (body) => ({
        url: `${rootPath}/${body.id}/`,
        method: "PUT",
        body,
      }),
      async onQueryStarted(args, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled
          dispatch(labelInvalidate)
          dispatch(testPlanLabelsInvalidate)
          dispatch(testSuiteTestCasesInvalidate)
          dispatch(suiteInvalidate())
          dispatch(setDrawerTestCase(data))
        } catch (error) {
          console.error(error)
        }
      },
      invalidatesTags: (result, _, { id, current_version }) =>
        result
          ? [
              { type: "TestCase", id },
              { type: "TestCase", id: "LIST" },
              { type: "TestCaseHistoryChanges", id: current_version },
            ]
          : [
              { type: "TestCase", id: "LIST" },
              { type: "TestCaseHistoryChanges", id: "LIST" },
            ],
    }),
    bulkUpdate: builder.mutation<TestCase[], TestCaseBulkUpdate>({
      query: (body) => ({
        url: `${rootPath}/bulk-update/`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "TestSuiteTestCases", id: "LIST" }],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(suiteInvalidate())
        dispatch(labelInvalidate)
        dispatch(testSuiteTestCasesInvalidate)
      },
    }),
    bulkTreeUpdate: builder.mutation<TestCase[], TestCaseBulkUpdate>({
      query: (body) => ({
        url: `${rootPath}/bulk-update-tree/`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "TestSuiteTestCases", id: "LIST" }],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(suiteInvalidate())
        dispatch(labelInvalidate)
        dispatch(testSuiteTestCasesInvalidate)
      },
    }),
    archiveTestCase: builder.mutation<void, number>({
      query: (id) => ({
        url: `${rootPath}/${id}/archive/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "TestCase", id: "LIST" },
        { type: "TestCase", id },
      ],
      async onQueryStarted(args, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled
          dispatch(setDrawerTestCaseIsArchive(true))
          dispatch(systemStatsInvalidate)
          dispatch(testSuiteTestCasesInvalidate)
          dispatch(suiteInvalidate())
        } catch (error) {
          console.error(error)
        }
      },
    }),
    getTestCaseById: builder.query<TestCase, GetTestCaseByIdParams>({
      query: ({ testCaseId, ...params }) => ({
        url: `${rootPath}/${testCaseId}/`,
        params,
        redirect: "follow",
      }),
      transformResponse(response: TestCase, meta: FetchBaseQueryMeta) {
        if (meta?.response?.redirected) {
          try {
            const redirectUrl = new URL(meta.response.url)
            const ver = redirectUrl.searchParams.get("ver")

            if (ver) {
              updateVersionEvent.dispatch({ ver: ver })
            }
          } catch (error) {
            console.error("Error handling redirect:", error)
          }
        }
        return response
      },
      providesTags: (_, __, { testCaseId }) => [{ type: "TestCase", id: testCaseId }],
    }),
    getTestCaseDeletePreview: builder.query<DeletePreviewResponse[], string>({
      query: (id) => ({
        url: `${rootPath}/${id}/delete/preview/`,
      }),
    }),
    getTestCaseArchivePreview: builder.query<DeletePreviewResponse[], string>({
      query: (id) => ({
        url: `${rootPath}/${id}/archive/preview/`,
      }),
    }),
    copyTestCase: builder.mutation<TestCase[], TestCaseCopyBody>({
      query: (body) => ({
        url: `${rootPath}/copy/`,
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(labelInvalidate)
        dispatch(testPlanLabelsInvalidate)
        dispatch(testSuiteTestCasesInvalidate)
        dispatch(suiteInvalidate())
      },
      invalidatesTags: [{ type: "TestCase", id: "LIST" }],
    }),
    getTestCaseHistoryChanges: builder.query<
      PaginationResponse<TestCaseHistoryChange[]>,
      QueryWithPagination<{ testCaseId: number }>
    >({
      query: ({ testCaseId, ...params }) => ({
        url: `${rootPath}/${testCaseId}/history/`,
        params,
      }),
      providesTags: (result) => providesList(result?.results, "TestCaseHistoryChanges", "version"),
    }),
    getTestCaseTestsList: builder.query<
      PaginationResponse<TestsWithPlanBreadcrumbs[]>,
      QueryWithPagination<TestCaseTestsList>
    >({
      query: ({ testCaseId, ...params }) => ({
        url: `${rootPath}/${testCaseId}/tests/`,
        params,
      }),
      providesTags: (result) => providesList(result?.results, "TestCaseTestsList"),
    }),
    restoreTestCase: builder.mutation<TestCase, { testCaseId: number; version: number }>({
      query: ({ testCaseId, ...body }) => ({
        url: `${rootPath}/${testCaseId}/version/restore/`,
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(labelInvalidate)
        dispatch(testPlanLabelsInvalidate)
        dispatch(testSuiteTestCasesInvalidate)
        dispatch(suiteInvalidate())
        dispatch(setDrawerTestCase(data))
      },
      invalidatesTags: [{ type: "TestCase", id: "LIST" }],
    }),
    getTestSuiteTestCases: builder.query<PaginationResponse<TestCase[]>, SearchTestCasesQuery>({
      providesTags: [{ type: "TestSuiteTestCases", id: "LIST" }],
      query: (params) => ({
        url: `${rootPath}/`,
        params: {
          ...params,
          parent: "null",
        },
      }),
    }),
  }),
})

export const testSuiteTestCasesInvalidate = testCaseApi.util.invalidateTags([
  { type: "TestSuiteTestCases", id: "LIST" },
])

export const {
  useLazySearchTestCasesQuery,
  useGetTestCaseByIdQuery,
  useLazyGetTestCaseByIdQuery,
  useCreateTestCaseMutation,
  useUpdateTestCaseMutation,
  useArchiveTestCaseMutation,
  useDeleteTestCaseMutation,
  useGetTestCaseDeletePreviewQuery,
  useCopyTestCaseMutation,
  useGetTestCaseHistoryChangesQuery,
  useGetTestCaseTestsListQuery,
  useGetTestCaseArchivePreviewQuery,
  useRestoreTestCaseMutation,
  useGetTestSuiteTestCasesQuery,
  useBulkUpdateMutation,
  useBulkTreeUpdateMutation,
} = testCaseApi
