// sort-imports-ignore
import { ThemeProvider } from "processes"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"

import "shared/styles/uikit.css"
import "shared/assets/fonts/Inter-VariableFont.ttf"

import App from "./App"
import { persistor, store } from "./app/store"

import "shared/libs/init-i18"

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const container = document.getElementById("root")!
const root = createRoot(container)

root.render(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </PersistGate>
    </Provider>
)
