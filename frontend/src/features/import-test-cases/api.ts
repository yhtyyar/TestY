import { createApi } from "@reduxjs/toolkit/dist/query/react"

import { baseQueryWithLogout } from "app/apiSlice"

export interface ZephyrImportResponse {
  suites_created: number
  cases_created: number
  steps_created: number
  errors: Array<{ key: string; name: string; error: string }>
}

export interface ZephyrImportAsyncResponse {
  task_id: string
  status: string
}

export const importApi = createApi({
  reducerPath: "importApi",
  baseQuery: baseQueryWithLogout,
  endpoints: (builder) => ({
    importZephyr: builder.mutation<ZephyrImportResponse | ZephyrImportAsyncResponse, FormData>({
      query: (formData) => ({
        url: "import/zephyr/",
        method: "POST",
        body: formData,
        formData: true,
      }),
    }),
  }),
})

export const { useImportZephyrMutation } = importApi
