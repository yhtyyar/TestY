import { AnyAction, ListenerEffectAPI, ThunkDispatch } from "@reduxjs/toolkit"
import { notification } from "antd"
import equal from "fast-deep-equal"
import { PathPattern, matchPath } from "react-router-dom"
import { ZodObject } from "zod"

import { AppDispatch, RootState } from "app/store"

import { getByPath } from "../utils"
import { EffectType, SlicePath } from "./types"
import { makeDebugLogger, schemaFillUndefined } from "./utils"

interface SyncUrlWithStateProps<TSchema extends ZodObject> {
  schema: TSchema
  slicePath: SlicePath
  allowedRoutes?: PathPattern<string>[]
  disAllowedRoutes?: PathPattern<string>[]
  effect: EffectType<TSchema>
  debug?: boolean
}

export const syncStateByUrl = <TSchema extends ZodObject>({
  schema,
  slicePath,
  allowedRoutes,
  disAllowedRoutes,
  effect,
  debug = false,
}: SyncUrlWithStateProps<TSchema>) => {
  return (
    _: AnyAction,
    listenerApi: ListenerEffectAPI<unknown, ThunkDispatch<unknown, unknown, AnyAction>, unknown>
  ) => {
    const log = makeDebugLogger(debug, slicePath, "syncStateByUrl")
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

    const dispatch = listenerApi.dispatch as AppDispatch
    const state = listenerApi.getState() as RootState

    const searchParams = new URLSearchParams(window.location.search)

    log("Location", {
      slicePath,
      location: window.location.search,
    })

    const urlObject: Record<string, unknown> = {}
    searchParams.forEach((value, key) => {
      urlObject[key] = value
    })

    const schemaWithUndefined = schemaFillUndefined(schema)
    const currentStateValue = getByPath(state, slicePath) as ReturnType<TSchema["parse"]>
    const parsed = schema.safeParse({
      ...schemaWithUndefined,
      ...currentStateValue,
      ...urlObject,
    })

    if (!parsed.success) {
      log("Failed to parse", {
        slicePath,
        value: urlObject,
      })
      notification.error({
        message: "Invalid query params",
        description: parsed.error.message,
      })
      return
    }

    const parsedCurrentValue = schema.safeParse({
      ...schemaWithUndefined,
      ...currentStateValue,
    })

    log("Validated", {
      slicePath,
      parsed,
      schemaWithUndefined,
      parsedCurrentValue,
      value: urlObject,
    })

    if (equal(parsed.data, parsedCurrentValue.data)) {
      return undefined
    }

    effect(parsed.data as ReturnType<TSchema["parse"]>, dispatch, state)
  }
}
