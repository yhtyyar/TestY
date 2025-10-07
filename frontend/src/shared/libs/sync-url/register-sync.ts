import { AnyAction, createListenerMiddleware } from "@reduxjs/toolkit"
import { MatchFunction } from "@reduxjs/toolkit/dist/listenerMiddleware/types"
import { PathPattern } from "react-router-dom"
import { ZodObject } from "zod"

import { initUrl, urlChangedByBrowser } from "app/slice"

import { config } from "shared/config"

import { syncStateByUrl } from "./sync-state-by-url"
import { syncUrlByState } from "./sync-url-by-state"
import { EffectType, HistoryType, SlicePath } from "./types"

interface RegisterSyncProps<TSchema extends ZodObject> {
  middleware: ReturnType<typeof createListenerMiddleware>
  matcher: MatchFunction<AnyAction>
  schema: TSchema
  slicePath: SlicePath
  allowedRoutes: PathPattern<string>[]
  disAllowedRoutes?: PathPattern<string>[]
  effectUrlToState: EffectType<TSchema>
  effectStateToUrl?: EffectType<TSchema>
  debug?: boolean
  history?: HistoryType
}

export const registerSync = <T extends ZodObject>({
  middleware,
  matcher,
  schema,
  slicePath,
  allowedRoutes,
  disAllowedRoutes,
  effectUrlToState,
  effectStateToUrl,
  debug = config.debugUrlParamsSync,
  history,
}: RegisterSyncProps<T>) => {
  const commonParams = { schema, slicePath, allowedRoutes, disAllowedRoutes, debug }

  // Слушатель для синхронизации URL по стейту (при событиях matcher) | url <- state
  middleware.startListening({
    matcher,
    effect: syncUrlByState<T>({
      ...commonParams,
      effect: effectStateToUrl,
      history,
    }),
  })

  // Слушатель для синхронизации URL по стейту (при изменении URL) | url <- state
  middleware.startListening({
    actionCreator: urlChangedByBrowser,
    effect: syncUrlByState<T>({
      ...commonParams,
      effect: effectUrlToState,
    }),
  })

  // Слушатель для синхронизации стейта по URL (при навигации пользователя) | state <- url
  middleware.startListening({
    actionCreator: urlChangedByBrowser,
    effect: syncStateByUrl<T>({
      ...commonParams,
      effect: effectUrlToState,
    }),
  })

  // Слушатель для синхронизации URL по стейту (при инициализации приложения) | url <- state
  middleware.startListening({
    actionCreator: initUrl,
    effect: syncUrlByState<T>({
      ...commonParams,
      history: "replace",
      effect: effectUrlToState,
    }),
  })
}
