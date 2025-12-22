import equal from "fast-deep-equal"
import { useCallback, useEffect, useRef } from "react"

import { LazyGetTriggerTypeResult, UseLazyQueryHook } from "app/export-types"

import { isAbortError } from "shared/libs"

import { AfterFn, BeforeFn, ConditionFn, ErrorFn, StartFn, SuccessFn } from "./types"

interface LazyAdvancedOptions<TParams, TData, TMeta, TError = unknown> {
  cancelStrategy?:
    | "always"
    | "same-params"
    | "never"
    | ((prevParams: TParams, currentParams: TParams) => boolean)
  condition?: ConditionFn<TParams, TData, TMeta>
  onBefore?: BeforeFn<TParams, TData, TMeta>
  onAfter?: AfterFn<TParams, TData, TMeta, TError>
  onStart?: StartFn<TParams, TData, TMeta>
  onSuccess?: SuccessFn<TParams, TData, TMeta>
  onError?: ErrorFn<TParams, TError, TMeta>
}

export const useLazyAdvanced = <TParams, TData, TMeta = unknown, TError = unknown>(
  useLazyHook: UseLazyQueryHook<TData, TParams>,
  propsOptions?: LazyAdvancedOptions<TParams, TData, TMeta, TError>
) => {
  const options = {
    cancelStrategy: "always",
    ...propsOptions,
  }

  const [originalTrigger, result] = useLazyHook()
  const lastRequest = useRef<LazyGetTriggerTypeResult<TData, TParams> | null>(null)
  const lastParams = useRef<TParams | null>(null)
  const isMounted = useRef<boolean>(true)

  const originalTriggerRef = useRef(originalTrigger)
  const resultRef = useRef(result)
  const optionsRef = useRef(options)

  useEffect(() => {
    originalTriggerRef.current = originalTrigger
    resultRef.current = result
    optionsRef.current = options
  })

  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
      abortRequest()
    }
  }, [])

  const setLastData = useCallback(
    (request: LazyGetTriggerTypeResult<TData, TParams> | null, params: TParams | null) => {
      lastRequest.current = request
      lastParams.current = params
    },
    []
  )

  const shouldCancelPrevious = useCallback((currentParams: TParams): boolean => {
    if (!lastRequest.current || !lastParams.current) return false

    if (typeof optionsRef.current.cancelStrategy === "function") {
      return optionsRef.current.cancelStrategy(lastParams.current, currentParams)
    }

    switch (optionsRef.current.cancelStrategy) {
      case "never":
        return false
      case "always":
        return true
      case "same-params":
        return equal(lastParams.current, currentParams)
      default:
        return true
    }
  }, [])

  const abortRequest = useCallback((params?: TParams) => {
    if (lastRequest.current && (params === undefined || shouldCancelPrevious(params))) {
      lastRequest.current.abort()
      setLastData(null, null)
    }
  }, [])

  const shouldSkipRequest = useCallback((args: TParams, meta?: TMeta): boolean => {
    const { condition, onBefore } = optionsRef.current
    const currentResult = resultRef.current as unknown as LazyGetTriggerTypeResult<TData, TParams>

    if (condition?.(args, currentResult, meta) === false) {
      return true
    }

    if (onBefore?.(args, currentResult, meta) === false) {
      return true
    }

    return false
  }, [])

  const handleSuccess = useCallback((args: TParams, data: TData, meta?: TMeta) => {
    const { onAfter, onSuccess } = optionsRef.current
    const currentResult = resultRef.current as unknown as LazyGetTriggerTypeResult<TData, TParams>

    onAfter?.(args, currentResult, undefined, meta)
    onSuccess?.(args, data, meta)
  }, [])

  const handleError = useCallback((args: TParams, error: TError, meta?: TMeta) => {
    const { onAfter, onError } = optionsRef.current
    const currentResult = resultRef.current as unknown as LazyGetTriggerTypeResult<TData, TParams>

    if (isAbortError(error)) return

    onAfter?.(args, currentResult, error, meta)
    onError?.(args, error, meta)
  }, [])

  const wrappedTrigger = useCallback(
    (args: TParams, meta?: TMeta) => {
      if (shouldSkipRequest(args, meta)) {
        return Promise.resolve(
          resultRef.current as unknown as LazyGetTriggerTypeResult<TData, TParams>
        ) as LazyGetTriggerTypeResult<TData, TParams>
      }

      if (optionsRef.current.cancelStrategy !== "never") {
        abortRequest(args)
      }

      const { onStart } = optionsRef.current
      onStart?.(
        args,
        resultRef.current as unknown as LazyGetTriggerTypeResult<TData, TParams>,
        meta
      )

      const request = originalTriggerRef.current(args)
      setLastData(request, args)

      request
        .then((response) => {
          if (lastRequest.current === request) {
            setLastData(null, null)
          }

          if (isMounted.current) {
            handleSuccess(args, response.data as TData, meta)
          }
          return response
        })
        .catch((error: TError) => {
          if (lastRequest.current === request) {
            setLastData(null, null)
          }

          if (isMounted.current) {
            handleError(args, error, meta)
          }
        })

      return request
    },
    [handleError, handleSuccess, shouldSkipRequest]
  )

  return [wrappedTrigger, result] as const
}
