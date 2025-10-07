import { act, renderHook } from "@testing-library/react"

import { useDebounce } from "./use-debounce"

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("basic functionality", () => {
    it("should return initial value immediately", () => {
      const { result } = renderHook(() => useDebounce("initial"))

      expect(result.current).toBe("initial")
    })

    it("should debounce value changes with default delay", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
        initialProps: { value: "initial" },
      })

      expect(result.current).toBe("initial")

      rerender({ value: "updated" })

      expect(result.current).toBe("initial")

      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(result.current).toBe("updated")
    })

    it("should debounce value changes with custom delay", () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: "initial", delay: 1000 },
      })

      rerender({ value: "updated", delay: 1000 })

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(result.current).toBe("initial")

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(result.current).toBe("updated")
    })
  })

  describe("skipInit functionality", () => {
    it("should skip first update when skipInit is true", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500, true), {
        initialProps: { value: "initial" },
      })

      rerender({ value: "first-update" })

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(result.current).toBe("initial")

      rerender({ value: "second-update" })

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(result.current).toBe("second-update")
    })

    it("should not skip updates when skipInit is false", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500, false), {
        initialProps: { value: "initial" },
      })

      rerender({ value: "updated" })

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(result.current).toBe("updated")
    })
  })

  describe("multiple rapid changes", () => {
    it("should only apply the last change after multiple rapid updates", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: "initial" },
      })

      rerender({ value: "update1" })
      rerender({ value: "update2" })
      rerender({ value: "update3" })

      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(result.current).toBe("initial")

      rerender({ value: "final" })

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(result.current).toBe("final")
    })

    it("should cancel previous timer on new value", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: "initial" },
      })

      rerender({ value: "update1" })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      rerender({ value: "update2" })

      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(result.current).toBe("initial")

      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(result.current).toBe("update2")
    })
  })

  describe("different data types", () => {
    it("should work with string values", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: "hello" },
      })

      rerender({ value: "world" })

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(result.current).toBe("world")
    })

    it("should work with number values", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: 0 },
      })

      rerender({ value: 42 })

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(result.current).toBe(42)
    })

    it("should work with object values", () => {
      const initial = { name: "John", age: 30 }
      const updated = { name: "Jane", age: 25 }

      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: initial },
      })

      rerender({ value: updated })

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(result.current).toEqual(updated)
    })

    it("should work with array values", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: [1, 2, 3] },
      })

      rerender({ value: [4, 5, 6] })

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(result.current).toEqual([4, 5, 6])
    })
  })

  describe("edge cases", () => {
    it("should handle undefined delay", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, undefined), {
        initialProps: { value: "initial" },
      })

      rerender({ value: "updated" })

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(result.current).toBe("updated")
    })

    it("should handle zero delay", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 0), {
        initialProps: { value: "initial" },
      })

      rerender({ value: "updated" })

      act(() => {
        vi.advanceTimersByTime(0)
      })
      expect(result.current).toBe("updated")
    })

    it("should handle same value updates", () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: "same" },
      })

      rerender({ value: "same" })

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(result.current).toBe("same")
    })
  })

  describe("cleanup", () => {
    it("should clear timeout on unmount", () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout")

      const { unmount, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: "initial" },
      })

      rerender({ value: "updated" })
      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()

      clearTimeoutSpy.mockRestore()
    })
  })

  describe("delay changes", () => {
    it("should handle delay changes during debounce", () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: "initial", delay: 1000 },
      })

      rerender({ value: "updated", delay: 1000 })

      act(() => {
        vi.advanceTimersByTime(500)
      })

      rerender({ value: "updated", delay: 200 })

      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(result.current).toBe("updated")
    })
  })
})
