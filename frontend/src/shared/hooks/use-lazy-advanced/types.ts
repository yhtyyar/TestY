import { LazyGetTriggerTypeResult } from "app/export-types"

export type ConditionFn<TParams, TData, TMeta> = (
  args: TParams,
  result: LazyGetTriggerTypeResult<TData, TParams> | undefined,
  meta?: TMeta
) => boolean

export type BeforeFn<TParams, TData, TMeta> = (
  args: TParams,
  result: LazyGetTriggerTypeResult<TData, TParams> | undefined,
  meta?: TMeta
) => boolean | void

export type AfterFn<TParams, TData, TMeta, TError> = (
  args: TParams,
  result: LazyGetTriggerTypeResult<TData, TParams> | undefined,
  error?: TError,
  meta?: TMeta
) => void

export type StartFn<TParams, TData, TMeta> = (
  args: TParams,
  result: LazyGetTriggerTypeResult<TData, TParams>,
  meta?: TMeta
) => void

export type SuccessFn<TParams, TData, TMeta> = (args: TParams, result: TData, meta?: TMeta) => void

export type ErrorFn<TParams, TError, TMeta> = (args: TParams, error: TError, meta?: TMeta) => void
