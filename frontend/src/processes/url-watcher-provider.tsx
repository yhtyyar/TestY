import { Outlet } from "react-router-dom"

import { useUrlWatcher } from "shared/hooks"

export const UrlWatcherProvider = () => {
  useUrlWatcher()

  return <Outlet />
}
