import { setupPersistStore, setupStore } from "./setup-store"

export const store = setupStore()
export const persistor = setupPersistStore(store)
