import { useEffect } from "react"
import { useLocation } from "react-router-dom"

import { useAppDispatch } from "app/hooks"
import { initUrl, urlChangedByBrowser } from "app/slice"

import { config } from "shared/config"

export function useUrlWatcher() {
  const dispatch = useAppDispatch()
  const location = useLocation()

  useEffect(() => {
    if (config.debugUrlParamsSync) {
      // eslint-disable-next-line no-console
      console.log("Url watcher started")
    }

    dispatch(initUrl())
  }, [])

  useEffect(() => {
    dispatch(urlChangedByBrowser())
  }, [location, dispatch])

  return null
}
