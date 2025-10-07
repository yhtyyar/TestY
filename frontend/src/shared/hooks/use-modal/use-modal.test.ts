import { act, renderHook } from "@testing-library/react"

import { useModal } from "./use-modal"

describe("useModal", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    addEventListenerSpy = vi.spyOn(document, "addEventListener")
    removeEventListenerSpy = vi.spyOn(document, "removeEventListener")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("initial state", () => {
    it("should start with isShow false by default", () => {
      const { result } = renderHook(() => useModal())

      expect(result.current.isShow).toBe(false)
    })

    it("should start with isShow true when defaultToggle is true", () => {
      const { result } = renderHook(() => useModal(true))

      expect(result.current.isShow).toBe(true)
    })
  })

  describe("modal controls", () => {
    it("should show modal when handleShow is called", () => {
      const { result } = renderHook(() => useModal())

      act(() => {
        result.current.handleShow()
      })

      expect(result.current.isShow).toBe(true)
    })

    it("should close modal when handleClose is called", () => {
      const { result } = renderHook(() => useModal(true))

      act(() => {
        result.current.handleClose()
      })

      expect(result.current.isShow).toBe(false)
    })

    it("should toggle modal state correctly", () => {
      const { result } = renderHook(() => useModal())

      act(() => {
        result.current.handleShow()
      })
      expect(result.current.isShow).toBe(true)

      act(() => {
        result.current.handleClose()
      })
      expect(result.current.isShow).toBe(false)
    })
  })

  describe("keyboard events", () => {
    it("should add keyup event listener on mount", () => {
      renderHook(() => useModal())

      expect(addEventListenerSpy).toHaveBeenCalledWith("keyup", expect.any(Function), false)
    })

    it("should remove keyup event listener on unmount", () => {
      const { unmount } = renderHook(() => useModal())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith("keyup", expect.any(Function), false)
    })

    it("should close modal when Escape key is pressed", () => {
      const { result } = renderHook(() => useModal(true))

      const addEventListenerCall = addEventListenerSpy.mock.calls[0]
      const escapeHandler = addEventListenerCall[1]

      act(() => {
        if (typeof escapeHandler === "function") {
          escapeHandler({ key: "Escape" } as KeyboardEvent)
        }
      })

      expect(result.current.isShow).toBe(false)
    })

    it("should not close modal when other keys are pressed", () => {
      const { result } = renderHook(() => useModal(true))

      const addEventListenerCall = addEventListenerSpy.mock.calls[0]
      const escapeHandler = addEventListenerCall[1]

      act(() => {
        if (typeof escapeHandler === "function") {
          escapeHandler({ key: "Enter" } as KeyboardEvent)
        }
      })

      expect(result.current.isShow).toBe(true)
    })

    it("should not affect closed modal when Escape is pressed", () => {
      const { result } = renderHook(() => useModal(false))

      const addEventListenerCall = addEventListenerSpy.mock.calls[0]
      const escapeHandler = addEventListenerCall[1]

      act(() => {
        if (typeof escapeHandler === "function") {
          escapeHandler({ key: "Escape" } as KeyboardEvent)
        }
      })

      expect(result.current.isShow).toBe(false)
    })
  })

  describe("integration scenarios", () => {
    it("should handle open -> escape -> open flow", () => {
      const { result } = renderHook(() => useModal())

      const addEventListenerCall = addEventListenerSpy.mock.calls[0]
      const escapeHandler = addEventListenerCall[1]

      act(() => {
        result.current.handleShow()
      })
      expect(result.current.isShow).toBe(true)

      act(() => {
        if (typeof escapeHandler === "function") {
          escapeHandler({ key: "Escape" } as KeyboardEvent)
        }
      })
      expect(result.current.isShow).toBe(false)

      act(() => {
        result.current.handleShow()
      })
      expect(result.current.isShow).toBe(true)
    })

    it("should maintain consistent handler references", () => {
      const { result, rerender } = renderHook(() => useModal())

      const firstHandleShow = result.current.handleShow
      const firstHandleClose = result.current.handleClose

      rerender()

      expect(result.current.handleShow).toBe(firstHandleShow)
      expect(result.current.handleClose).toBe(firstHandleClose)
    })
  })

  describe("memory leaks prevention", () => {
    it("should remove event listener when component unmounts", () => {
      const { unmount } = renderHook(() => useModal())

      vi.clearAllMocks()

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1)
      expect(removeEventListenerSpy).toHaveBeenCalledWith("keyup", expect.any(Function), false)
    })
  })
})
