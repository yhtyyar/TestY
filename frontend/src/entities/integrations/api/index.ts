import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

import { invalidatesList, providesList } from "shared/libs"

const rootPath = "integrations"

export const integrationsApi = createApi({
  reducerPath: "integrationsApi",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["Integration"],
  endpoints: (builder) => ({
    getIntegrations: builder.query<
      PaginationResponse<IntegrationEntity[]>,
      QueryWithPagination<GetIntegrationsParams>
    >({
      query: (params) => ({
        url: `${rootPath}/`,
        params,
      }),
      providesTags: (result) => providesList(result?.results, "Integration", "project"),
    }),
    createIntegration: builder.mutation<IntegrationEntity, IntegrationUpdate>({
      query: (body) => ({
        url: `${rootPath}/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Integration", id: "LIST" }],
    }),
    updateIntegration: builder.mutation<IntegrationEntity, { id: Id; body: IntegrationUpdate }>({
      query: ({ id, body }) => ({
        url: `${rootPath}/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result) => invalidatesList(result, "Integration", "id", false),
    }),
    deleteIntegration: builder.mutation<void, Id>({
      query: (id) => ({
        url: `${rootPath}/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Integration", id: "LIST" }],
    }),
  }),
})

export const integrationsInvalidate = integrationsApi.util.invalidateTags([
  { type: "Integration", id: "LIST" },
])

export const {
  useGetIntegrationsQuery,
  useLazyGetIntegrationsQuery,
  useCreateIntegrationMutation,
  useUpdateIntegrationMutation,
  useDeleteIntegrationMutation,
} = integrationsApi
