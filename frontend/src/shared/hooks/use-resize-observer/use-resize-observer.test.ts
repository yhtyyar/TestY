import { renderHook } from "@testing-library/react"
import { useRef } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useResizeObserver } from "./use-resize-observer"

const mockObserve = vi.fn()
const mockUnobserve = vi.fn()
const mockDisconnect = vi.fn()

const MockResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
  callback,
}))

const originalResizeObserver = global.ResizeObserver

describe("useResizeObserver", () => {
  beforeEach(() => {
    global.ResizeObserver = MockResizeObserver
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.ResizeObserver = originalResizeObserver
  })

  it("should create ResizeObserver and observe element when ref is available", () => {
    const mockElement = {
      offsetWidth: 100,
    } as HTMLElement

    const mockRef = { current: mockElement }
    const mockOnResize = vi.fn()

    renderHook(() =>
      useResizeObserver({
        elRef: mockRef,
        onResize: mockOnResize,
      })
    )

    expect(MockResizeObserver).toHaveBeenCalledWith(expect.any(Function))
    expect(mockObserve).toHaveBeenCalledWith(mockElement)
  })

  it("should not observe when ref.current is null", () => {
    const mockRef = { current: null }
    const mockOnResize = vi.fn()

    renderHook(() =>
      useResizeObserver({
        elRef: mockRef,
        onResize: mockOnResize,
      })
    )

    expect(MockResizeObserver).not.toHaveBeenCalled()
    expect(mockObserve).not.toHaveBeenCalled()
  })

  it("should call onResize with correct parameters when resize occurs", () => {
    const mockElement = {
      offsetWidth: 150,
    } as HTMLElement

    const mockRef = { current: mockElement }
    const mockOnResize = vi.fn()

    renderHook(() =>
      useResizeObserver({
        elRef: mockRef,
        onResize: mockOnResize,
      })
    )

    const resizeObserverCallback = MockResizeObserver.mock.calls[0][0]

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    resizeObserverCallback([])

    expect(mockOnResize).toHaveBeenCalledWith(mockRef, 150)
  })

  it("should not call onResize if element becomes null during resize", () => {
    const mockElement = {
      offsetWidth: 150,
    } as HTMLElement | null

    const mockRef = { current: mockElement }
    const mockOnResize = vi.fn()

    renderHook(() =>
      useResizeObserver({
        elRef: mockRef,
        onResize: mockOnResize,
      })
    )

    const resizeObserverCallback = MockResizeObserver.mock.calls[0][0]
    mockRef.current = null

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    resizeObserverCallback([])

    expect(mockOnResize).not.toHaveBeenCalled()
  })

  it("should disconnect observer on unmount", () => {
    const mockElement = {
      offsetWidth: 100,
    } as HTMLElement

    const mockRef = { current: mockElement }
    const mockOnResize = vi.fn()

    const { unmount } = renderHook(() =>
      useResizeObserver({
        elRef: mockRef,
        onResize: mockOnResize,
      })
    )

    unmount()

    expect(mockDisconnect).toHaveBeenCalled()
  })

  it("should work with useRef hook", () => {
    const mockOnResize = vi.fn()

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null)
      useResizeObserver({
        elRef: ref,
        onResize: mockOnResize,
      })
      return ref
    })

    expect(MockResizeObserver).not.toHaveBeenCalled()

    const mockElement = {
      offsetWidth: 200,
    } as HTMLDivElement

    // @ts-ignore
    result.current.current = mockElement

    renderHook(() =>
      useResizeObserver({
        elRef: result.current,
        onResize: mockOnResize,
      })
    )

    expect(MockResizeObserver).toHaveBeenCalled()
    expect(mockObserve).toHaveBeenCalledWith(mockElement)
  })
})
