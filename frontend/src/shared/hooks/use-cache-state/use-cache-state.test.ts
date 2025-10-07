import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useCacheState } from "./use-cache-state"

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
})

describe("useCacheState", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("initialization", () => {
    it("returns value from localStorage if it exists", () => {
      localStorageMock.getItem.mockReturnValue("cached value")

      const { result } = renderHook(() => useCacheState("test-key", "default"))

      expect(result.current[0]).toBe("cached value")
      expect(localStorageMock.getItem).toHaveBeenCalledWith("test-key")
    })

    it("returns initial value if localStorage is empty", () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useCacheState("test-key", "default"))

      expect(result.current[0]).toBe("default")
    })

    it("works with function as initial value", () => {
      localStorageMock.getItem.mockReturnValue(null)
      const initializer = vi.fn(() => "initialized value")

      const { result } = renderHook(() => useCacheState("test-key", initializer))

      expect(result.current[0]).toBe("initialized value")
      expect(initializer).toHaveBeenCalled()
    })
  })

  describe("value updating", () => {
    it("updates state and saves to localStorage", () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useCacheState("test-key", "default"))

      act(() => {
        result.current[1]("new value")
      })

      expect(result.current[0]).toBe("new value")
      expect(localStorageMock.setItem).toHaveBeenCalledWith("test-key", "new value")
    })

    it("correctly handles different data types", () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useCacheState("test-key", 0))

      act(() => {
        result.current[1](42)
      })

      expect(result.current[0]).toBe(42)
      expect(localStorageMock.setItem).toHaveBeenCalledWith("test-key", "42")
    })
  })

  describe("parse function usage", () => {
    it("uses parse for parsing value from localStorage", () => {
      localStorageMock.getItem.mockReturnValue('{"count": 5}')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      const parser = vi.fn((value: string): { count: number } => JSON.parse(value))

      const { result } = renderHook(() => useCacheState("test-key", { count: 0 }, parser))

      expect(result.current[0]).toEqual({ count: 5 })
      expect(parser).toHaveBeenCalledWith('{"count": 5}')
    })

    it("calls parse function when localStorage has value", () => {
      localStorageMock.getItem.mockReturnValue('{"count": 10}')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      const parser = vi.fn((value: string): { count: number } => JSON.parse(value))

      renderHook(() => useCacheState("test-key", { count: 0 }, parser))

      // Parser should be called at least once
      expect(parser).toHaveBeenCalledWith('{"count": 10}')
    })

    it("works with objects through JSON.parse", () => {
      localStorageMock.getItem.mockReturnValue('{"name": "John", "age": 30}')

      const { result } = renderHook(() =>
        useCacheState(
          "user-key",
          { name: "", age: 0 },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          (value: string): { name: string; age: number } => JSON.parse(value)
        )
      )

      expect(result.current[0]).toEqual({ name: "John", age: 30 })
    })

    it("doesn't call parse when localStorage is empty", () => {
      localStorageMock.getItem.mockReturnValue(null)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      const parser = vi.fn((value: string): { count: number } => JSON.parse(value))

      const { result } = renderHook(() => useCacheState("test-key", { count: 0 }, parser))

      expect(result.current[0]).toEqual({ count: 0 })
      expect(parser).not.toHaveBeenCalled()
    })

    it("saves objects as JSON strings", () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useCacheState("user-key", { name: "", age: 0 }))

      const newUser = { name: "Jane", age: 25 }

      act(() => {
        result.current[1](newUser)
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith("user-key", "[object Object]")
    })
  })

  describe("edge cases", () => {
    it("handles null values from localStorage", () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useCacheState("test-key", "default"))

      expect(result.current[0]).toBe("default")
    })

    it("handles empty string from localStorage", () => {
      localStorageMock.getItem.mockReturnValue("")

      const { result } = renderHook(() => useCacheState("test-key", "default"))

      expect(result.current[0]).toBe("")
    })

    it("handles errors in parse function", () => {
      localStorageMock.getItem.mockReturnValue("invalid json")
      const parser = vi.fn(() => {
        throw new Error("Parse error")
      })

      expect(() => {
        renderHook(() => useCacheState("test-key", { count: 0 }, parser))
      }).toThrow("Parse error")
    })

    it("handles boolean values", () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useCacheState("bool-key", false))

      act(() => {
        result.current[1](true)
      })

      expect(result.current[0]).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith("bool-key", "true")
    })

    it("handles arrays", () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useCacheState("array-key", [1, 2, 3]))

      act(() => {
        result.current[1]([4, 5, 6])
      })

      expect(result.current[0]).toEqual([4, 5, 6])
      expect(localStorageMock.setItem).toHaveBeenCalledWith("array-key", "4,5,6")
    })
  })

  describe("useEffect behavior", () => {
    it("syncs with localStorage on mount", () => {
      localStorageMock.getItem.mockReturnValue("stored value")

      const { result } = renderHook(() => useCacheState("test-key", "default"))

      expect(result.current[0]).toBe("stored value")
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(2)
    })

    it("uses initial value when localStorage is empty", () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useCacheState("test-key", "default"))

      expect(result.current[0]).toBe("default")
    })
  })
})
