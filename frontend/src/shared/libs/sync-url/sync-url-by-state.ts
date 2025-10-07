import type { AnyAction, ListenerEffect, ListenerEffectAPI, ThunkDispatch } from "@reduxjs/toolkit"
import { PathPattern, matchPath } from "react-router-dom"
import { ZodObject } from "zod"

import { AppDispatch, RootState } from "app/store"

import { getByPath } from "../utils"
import { showZodErrorsNotifications } from "../zod.utils"
import { EffectType, HistoryType, SlicePath } from "./types"
import { makeDebugLogger, updateUrlParam } from "./utils"

export interface SyncStateWithUrlParams<TSchema extends ZodObject> {
  schema: TSchema
  slicePath: SlicePath
  allowedRoutes?: PathPattern<string>[]
  disAllowedRoutes?: PathPattern<string>[]
  effect?: EffectType<TSchema>
  history?: HistoryType
  debug?: boolean
}

export function syncUrlByState<TSchema extends ZodObject>({
  schema,
  slicePath,
  allowedRoutes,
  disAllowedRoutes,
  effect,
  history = "push",
  debug = false,
}: SyncStateWithUrlParams<TSchema>): ListenerEffect<
  AnyAction,
  unknown,
  ThunkDispatch<unknown, unknown, AnyAction>,
  unknown
> {
  return (
    _: AnyAction,
    listenerApi: ListenerEffectAPI<unknown, ThunkDispatch<unknown, unknown, AnyAction>, unknown>
  ) => {
    const log = makeDebugLogger(debug, slicePath, "syncUrlByState")
    const isAllowedRoute = allowedRoutes?.some((route) =>
      matchPath(route, window.location.pathname)
    )

    const isDisallowedRoute = disAllowedRoutes?.some((route) =>
      matchPath(route, window.location.pathname)
    )

    if (!isAllowedRoute || isDisallowedRoute) {
      log("Not allowed route", {
        slicePath,
        isAllowedRoute,
        allowedRoutes,
        disAllowedRoutes,
        isDisallowedRoute,
        location: window.location.pathname,
      })
      return
    }

    const state = listenerApi.getState() as RootState
    const dispatch = listenerApi.dispatch as AppDispatch
    const value = getByPath(state, slicePath)

    const parsed = schema.safeParse(value)
    if (!parsed.success) {
      log("Failed to parse", { slicePath, value })
      showZodErrorsNotifications(parsed.error)
      return
    }

    const searchParams = new URLSearchParams(window.location.search)

    Object.entries(parsed.data).forEach(([key, val]) => {
      updateUrlParam(searchParams, key, val)
    })

    const newSearch = searchParams.toString()
    const currentSearch = window.location.search.startsWith("?")
      ? window.location.search.slice(1)
      : window.location.search

    log("Data", {
      slicePath,
      newSearch,
      currentSearch,
      parsed,
      value,
    })

    if (newSearch !== currentSearch) {
      const newUrl = window.location.pathname + (newSearch ? "?" + newSearch : "")
      if (history === "push") {
        window.history.pushState({}, "", newUrl)
      } else {
        window.history.replaceState({}, "", newUrl)
      }

      window.dispatchEvent(new PopStateEvent("popstate")) // tigger event for react-router-dom

      if (effect) {
        effect(parsed.data as ReturnType<TSchema["parse"]>, dispatch, state)
      }
    }
  }
}
