import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit"
import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

import { testPlanApi } from "entities/test-plan/api"

import { invalidatesList, providesList } from "shared/libs"

const rootPath = "statuses"

const invalidatesAllByStatus = (
  project: number,
  parent: number | null,
  dispatch: ThunkDispatch<unknown, unknown, AnyAction>
) => {
  dispatch(
    testPlanApi.util.invalidateTags([{ type: "TestPlanStatistics", id: `${project}-${parent}` }])
  )
}

export const statusesApi = createApi({
  reducerPath: "statusesApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["Status"],
  endpoints: (builder) => ({
    getStatuses: builder.query<Status[], GetStatusesParams>({
      query: ({ project }) => ({
        url: `${rootPath}/`,
        params: { project },
      }),
      providesTags: (result) => providesList(result, "Status"),
    }),
    createStatus: builder.mutation<Status, StatusUpdate>({
      query: (body) => ({
        url: `${rootPath}/`,
        method: "POST",
        body,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          invalidatesAllByStatus(data.project, null, dispatch)
        } catch (error) {
          console.error(error)
        }
      },
      invalidatesTags: [{ type: "Status", id: "LIST" }],
    }),
    updateStatus: builder.mutation<Status, { id: Id; body: StatusUpdate }>({
      query: ({ id, body }) => ({
        url: `${rootPath}/${id}/`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          invalidatesAllByStatus(data.project, null, dispatch)
        } catch (error) {
          console.error(error)
        }
      },
      invalidatesTags: (result) => invalidatesList(result, "Status"),
    }),
    deleteStatus: builder.mutation<void, { id: Id; project: number }>({
      query: ({ id }) => ({
        url: `${rootPath}/${id}/`,
        method: "DELETE",
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          invalidatesAllByStatus(args.project, null, dispatch)
        } catch (error) {
          console.error(error)
        }
      },
      invalidatesTags: [{ type: "Status", id: "LIST" }],
    }),
  }),
})

export const statusInvalidate = statusesApi.util.invalidateTags([{ type: "Status", id: "LIST" }])

export const {
  useGetStatusesQuery,
  useLazyGetStatusesQuery,
  useCreateStatusMutation,
  useUpdateStatusMutation,
  useDeleteStatusMutation,
} = statusesApi
