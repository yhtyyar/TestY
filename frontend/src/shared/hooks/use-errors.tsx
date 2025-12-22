import { Dispatch, SetStateAction } from "react"

import { isFetchBaseQueryError } from "shared/libs"

import { useAntdModals } from "./use-antd-modals"

// prettier-ignore
export const useErrors = <T, >(onSetErrors: Dispatch<SetStateAction<T | null>>) => {
  const { initInternalError } = useAntdModals()

  const onHandleError = (err: unknown, showError400 = false) => {
    if (isFetchBaseQueryError(err)) {
      if (err?.status && ((err.status === 400 && !showError400) || err.status === 403)) {
        let errData = err.data as T
        if (err.status === 403) {
          errData = { errors: [(err.data as { detail: string })?.detail] } as T
        }
        onSetErrors(errData)
      } else {
        initInternalError(err)
      }
    } else {
      initInternalError(err)
    }
  }

  return {
    onHandleError,
  }
}
