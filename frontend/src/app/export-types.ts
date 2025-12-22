/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LazyQueryTrigger,
  UseLazyQuery,
  UseQueryStateResult,
} from "@reduxjs/toolkit/dist/query/react/buildHooks"
import { FetchBaseQueryMeta, QueryActionCreatorResult } from "@reduxjs/toolkit/query"
import { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { BaseQueryFn, FetchArgs, QueryDefinition } from "@reduxjs/toolkit/query"

export type LazyGetTriggerType<
  TData,
  TParams = QueryWithPagination<Record<any, any>>,
> = LazyQueryTrigger<
  QueryDefinition<
    TParams,
    BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, object, FetchBaseQueryMeta>,
    never,
    TData,
    any
  >
>

export type UseLazyQueryHook<TData, TParams> = UseLazyQuery<
  QueryDefinition<
    TParams,
    BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>,
    never,
    TData,
    any
  >
>

export type UseLazyQueryHookResult<TData, TParams> = UseQueryStateResult<
  QueryDefinition<
    TParams,
    BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>,
    any,
    TData,
    any
  >,
  any
>

export type LazyGetTriggerTypeResult<TData, TParams> = QueryActionCreatorResult<
  QueryDefinition<
    TParams,
    BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>,
    never,
    TData,
    any
  >
>
