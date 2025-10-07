import { RenderOptions, render } from "@testing-library/react"
import { ThemeProvider } from "processes"
import { ReactElement, ReactNode } from "react"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router-dom"
import { PersistGate } from "redux-persist/integration/react"

import { AppStore, RootState, persistor, setupStore } from "app/store"

interface ExtendedRenderOptions extends Omit<RenderOptions, "queries"> {
  preloadedState?: Partial<RootState>
  store?: AppStore
  route?: string
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    route = "/",
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <MemoryRouter initialEntries={[route]}>
            <ThemeProvider>{children}</ThemeProvider>
          </MemoryRouter>
        </PersistGate>
      </Provider>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}
