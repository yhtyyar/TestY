import { act, renderHook } from "@testing-library/react"
import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useDatepicker } from "./use-datepicker"

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

describe("useDatepicker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("initial state", () => {
    it("initializes with current date for both dateTo and dateFrom", () => {
      const { result } = renderHook(() => useDatepicker())

      expect(result.current.dateTo).toBeNull()
      expect(result.current.dateFrom).toBeNull()
    })

    it("provides setter functions", () => {
      const { result } = renderHook(() => useDatepicker())

      expect(typeof result.current.setDateTo).toBe("function")
      expect(typeof result.current.setDateFrom).toBe("function")
    })

    it("provides disabled date functions", () => {
      const { result } = renderHook(() => useDatepicker())

      expect(typeof result.current.disabledDateFrom).toBe("function")
      expect(typeof result.current.disabledDateTo).toBe("function")
    })
  })

  describe("date updates", () => {
    it("updates dateTo when setDateTo is called", () => {
      const { result } = renderHook(() => useDatepicker())
      const newDate = dayjs().add(5, "day")

      act(() => {
        result.current.setDateTo(newDate)
      })

      expect(result.current.dateTo).toEqual(newDate)
    })

    it("updates dateFrom when setDateFrom is called", () => {
      const { result } = renderHook(() => useDatepicker())
      const newDate = dayjs().subtract(5, "day")

      act(() => {
        result.current.setDateFrom(newDate)
      })

      expect(result.current.dateFrom).toEqual(newDate)
    })

    it("allows setting null values", () => {
      const { result } = renderHook(() => useDatepicker())

      act(() => {
        result.current.setDateTo(null)
        result.current.setDateFrom(null)
      })

      expect(result.current.dateTo).toBe(null)
      expect(result.current.dateFrom).toBe(null)
    })
  })

  describe("disabledDateFrom function", () => {
    it("disables dates that are same or after dateTo", () => {
      const { result } = renderHook(() => useDatepicker())
      const dateTo = dayjs("2024-01-15")

      act(() => {
        result.current.setDateTo(dateTo)
      })

      expect(result.current.disabledDateFrom(dayjs("2024-01-15"))).toBe(true)
      expect(result.current.disabledDateFrom(dayjs("2024-01-16"))).toBe(true)
      expect(result.current.disabledDateFrom(dayjs("2024-01-14"))).toBe(false)
    })

    it("handles edge cases with dateTo", () => {
      const { result } = renderHook(() => useDatepicker())
      const dateTo = dayjs("2024-01-15")

      act(() => {
        result.current.setDateTo(dateTo)
      })

      expect(result.current.disabledDateFrom(dayjs("2024-12-31"))).toBe(true)
      expect(result.current.disabledDateFrom(dayjs("2024-01-01"))).toBe(false)
    })
  })

  describe("disabledDateTo function", () => {
    it("disables dates that are same or before dateFrom", () => {
      const { result } = renderHook(() => useDatepicker())
      const dateFrom = dayjs("2024-01-10")

      act(() => {
        result.current.setDateFrom(dateFrom)
      })

      expect(result.current.disabledDateTo(dayjs("2024-01-10"))).toBe(true)
      expect(result.current.disabledDateTo(dayjs("2024-01-09"))).toBe(true)
      expect(result.current.disabledDateTo(dayjs("2024-01-11"))).toBe(false)
    })

    it("handles edge cases with dateFrom", () => {
      const { result } = renderHook(() => useDatepicker())
      const dateFrom = dayjs("2024-01-10")

      act(() => {
        result.current.setDateFrom(dateFrom)
      })

      expect(result.current.disabledDateTo(dayjs("2024-01-01"))).toBe(true)
      expect(result.current.disabledDateTo(dayjs("2024-12-31"))).toBe(false)
    })
  })

  describe("date range validation", () => {
    it("maintains proper date range when both dates are set", () => {
      const { result } = renderHook(() => useDatepicker())
      const dateFrom = dayjs("2024-01-10")
      const dateTo = dayjs("2024-01-20")

      act(() => {
        result.current.setDateFrom(dateFrom)
        result.current.setDateTo(dateTo)
      })

      expect(result.current.disabledDateFrom(dayjs("2024-01-15"))).toBe(false) // 🔴 была ошибка
      expect(result.current.disabledDateFrom(dayjs("2024-01-20"))).toBe(true) // ✅
      expect(result.current.disabledDateFrom(dayjs("2024-01-21"))).toBe(true) // ✅

      expect(result.current.disabledDateFrom(dayjs("2024-01-05"))).toBe(false) // ✅

      expect(result.current.disabledDateTo(dayjs("2024-01-10"))).toBe(true) // ✅
      expect(result.current.disabledDateTo(dayjs("2024-01-09"))).toBe(true) // ✅
      expect(result.current.disabledDateTo(dayjs("2024-01-15"))).toBe(false) // ✅
      expect(result.current.disabledDateTo(dayjs("2024-01-25"))).toBe(false) // ✅
    })

    it("handles same date for both dateFrom and dateTo", () => {
      const { result } = renderHook(() => useDatepicker())
      const sameDate = dayjs("2024-01-15")

      act(() => {
        result.current.setDateFrom(sameDate)
        result.current.setDateTo(sameDate)
      })

      expect(result.current.disabledDateFrom(sameDate)).toBe(true)
      expect(result.current.disabledDateTo(sameDate)).toBe(true)
    })
  })

  describe("null date handling", () => {
    it("handles null dateTo in disabledDateFrom", () => {
      const { result } = renderHook(() => useDatepicker())

      act(() => {
        result.current.setDateTo(null)
      })

      expect(() => {
        result.current.disabledDateFrom(dayjs("2024-01-15"))
      }).not.toThrow()
    })

    it("handles null dateFrom in disabledDateTo", () => {
      const { result } = renderHook(() => useDatepicker())

      act(() => {
        result.current.setDateFrom(null)
      })

      expect(() => {
        result.current.disabledDateTo(dayjs("2024-01-15"))
      }).not.toThrow()
    })
  })
})
