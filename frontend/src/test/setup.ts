import "@testing-library/jest-dom"
import type * as ReactRouterDom from "react-router-dom"
import { vi } from "vitest"

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

vi.mock("react-router-dom", async (importOriginal): Promise<Partial<typeof ReactRouterDom>> => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const actual = (await importOriginal()) as typeof ReactRouterDom
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: "/",
      search: "",
      hash: "",
      state: null,
      key: "default",
    }),
  }
})

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
})
