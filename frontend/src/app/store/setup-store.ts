import { EmptyObject, PreloadedState, combineReducers, configureStore } from "@reduxjs/toolkit"
import { commentsApi } from "entities/comments/api"
import { importApi } from "features/import-test-cases/api"
import { commentsReducer } from "entities/comments/model/slice"
import { customAttributeApi } from "entities/custom-attribute/api"
import { integrationsApi } from "entities/integrations/api"
import { notificationApi } from "entities/notifications/api"
import { notificationWSReducer } from "entities/notifications/model/notification-ws-slice"
import { notificationWSMiddleware } from "entities/notifications/ws"
import { roleApi } from "entities/roles/api"
import { roleReducer } from "entities/roles/model"
import { statusesApi } from "entities/status/api"
import { Store } from "redux"
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer } from "redux-persist"
import persistStore from "redux-persist/es/persistStore"
import storage from "redux-persist/lib/storage"

import { attachmentApi } from "entities/attachment/api"

import { authApi } from "entities/auth/api"
import authReducer from "entities/auth/model"

import { labelApi } from "entities/label/api"

import { parameterApi } from "entities/parameter/api"
import parameterReducer from "entities/parameter/model"

import { projectApi } from "entities/project/api"
import { projectReducer } from "entities/project/model/slice"

import { resultApi } from "entities/result/api"
import { resultsReducer } from "entities/result/model/slice"

import { suiteApi } from "entities/suite/api"

import { systemApi } from "entities/system/api"
import { systemReducer } from "entities/system/model/slice"
import { themeReducer } from "entities/system/model/slice-theme"

import { testApi } from "entities/test/api"
import { testReducer, testsfilterReducer } from "entities/test/model"
import { testsUrlSyncMiddleware } from "entities/test/model/listeners"

import { testCaseApi } from "entities/test-case/api"
import { testCaseReducer, testCasesfilterReducer } from "entities/test-case/model"
import { testCasesUrlSyncMiddleware } from "entities/test-case/model/listeners"

import { testPlanApi } from "entities/test-plan/api"
import { testPlanReducer } from "entities/test-plan/model"

import { usersApi } from "entities/user/api"
import { userReducer } from "entities/user/model"

import { appReducer } from "../slice"

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user", "auth", "system", "results", "comments", "theme"],
}

const rootReducer = combineReducers({
  app: appReducer,
  auth: authReducer,
  testCase: testCaseReducer,
  user: userReducer,
  parameter: parameterReducer,
  project: projectReducer,
  testPlan: testPlanReducer,
  test: testReducer,
  role: roleReducer,
  system: systemReducer,
  testsFilter: testsfilterReducer,
  testCasesFilter: testCasesfilterReducer,
  results: resultsReducer,
  comments: commentsReducer,
  theme: themeReducer,
  [systemApi.reducerPath]: systemApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [projectApi.reducerPath]: projectApi.reducer,
  [suiteApi.reducerPath]: suiteApi.reducer,
  [testCaseApi.reducerPath]: testCaseApi.reducer,
  [testPlanApi.reducerPath]: testPlanApi.reducer,
  [parameterApi.reducerPath]: parameterApi.reducer,
  [testApi.reducerPath]: testApi.reducer,
  [resultApi.reducerPath]: resultApi.reducer,
  [attachmentApi.reducerPath]: attachmentApi.reducer,
  [labelApi.reducerPath]: labelApi.reducer,
  [integrationsApi.reducerPath]: integrationsApi.reducer,
  [statusesApi.reducerPath]: statusesApi.reducer,
  [roleApi.reducerPath]: roleApi.reducer,
  [commentsApi.reducerPath]: commentsApi.reducer,
  [customAttributeApi.reducerPath]: customAttributeApi.reducer,
  [notificationApi.reducerPath]: notificationApi.reducer,
  [importApi.reducerPath]: importApi.reducer,
  notificationWS: notificationWSReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const setupStore = (preloadedState?: PreloadedState<EmptyObject>) => {
  return configureStore({
    reducer: persistedReducer,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    preloadedState,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    enhancers: (defaultEnhancers) => [...defaultEnhancers],
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      })
        .concat(testsUrlSyncMiddleware.middleware)
        .concat(testCasesUrlSyncMiddleware.middleware)
        .concat(authApi.middleware)
        .concat(projectApi.middleware)
        .concat(usersApi.middleware)
        .concat(suiteApi.middleware)
        .concat(testCaseApi.middleware)
        .concat(testPlanApi.middleware)
        .concat(parameterApi.middleware)
        .concat(testApi.middleware)
        .concat(resultApi.middleware)
        .concat(attachmentApi.middleware)
        .concat(labelApi.middleware)
        .concat(integrationsApi.middleware)
        .concat(statusesApi.middleware)
        .concat(commentsApi.middleware)
        .concat(roleApi.middleware)
        .concat(systemApi.middleware)
        .concat(customAttributeApi.middleware)
        .concat(notificationApi.middleware)
        .concat(importApi.middleware)
        .concat(notificationWSMiddleware),
    devTools: import.meta.env.NODE_ENV !== "production",
  })
}

export const setupPersistStore = (store: Store) => {
  return persistStore(store)
}
