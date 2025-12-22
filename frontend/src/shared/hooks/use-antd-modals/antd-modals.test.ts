import { renderHook } from "@testing-library/react"
import { App } from "antd"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useAntdModals } from "./use-antd-modals"

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  resources: {
    en: {
      translation: {},
    },
  },
})

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd")

  const mockModal = { confirm: vi.fn() }
  const mockNotification = {
    success: vi.fn(),
    error: vi.fn(),
  }

  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: vi.fn(() => ({
        modal: mockModal,
        notification: mockNotification,
      })),
    },
  }
})

describe("useAntdModals", () => {
  const mockModal = { confirm: vi.fn() }
  const mockNotification = {
    success: vi.fn(),
    error: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(App.useApp).mockReturnValue({
      // @ts-ignore
      modal: mockModal,
      // @ts-ignore
      notification: mockNotification,
    })
  })

  describe("antdModalConfirm", () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("calls Modal.confirm with proper test ids and props", () => {
      const {
        result: {
          current: { antdModalConfirm },
        },
      } = renderHook(() => useAntdModals())

      const title = "Confirm something"
      const bodyProps = { className: "custom-body" }

      antdModalConfirm("test", { title, bodyProps })

      expect(mockModal.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(Object),
          bodyProps: expect.objectContaining({
            "data-testid": "test-modal-confirm",
            className: "custom-body",
          }),
          okButtonProps: expect.objectContaining({ "data-testid": "test-button-confirm" }),
          cancelButtonProps: expect.objectContaining({ "data-testid": "test-button-cancel" }),
        })
      )
    })
  })

  describe("antdModalCloseConfirm", () => {
    it("calls antdModalConfirm with close confirm text", () => {
      const {
        result: {
          current: { antdModalCloseConfirm },
        },
      } = renderHook(() => useAntdModals())
      const mockCallback = vi.fn()

      antdModalCloseConfirm(mockCallback)

      expect(mockModal.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(Object),
          content: i18n.t("You will lose your data if you continue!"),
          onOk: expect.any(Function),
        })
      )

      let onOkFn: () => void = () => {}

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      ;(mockModal.confirm as unknown as Mock).mockImplementation((args) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        onOkFn = args.onOk
      })

      antdModalCloseConfirm(mockCallback)
      onOkFn()

      expect(mockCallback).toHaveBeenCalled()
    })
  })

  describe("antdNotification", () => {
    afterEach(() => {
      vi.clearAllMocks()
    })

    it("shows success notification with correct data-testid", () => {
      const {
        result: {
          current: { antdNotification },
        },
      } = renderHook(() => useAntdModals())

      antdNotification.success("success-test", { description: "Success message" })

      expect(mockNotification.success).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(Object),
          props: { "data-testid": "success-test-notification-success" },
          closable: true,
          placement: "bottom",
          description: null,
          icon: expect.any(Object),
        })
      )
    })

    it("shows error notification with correct data-testid", () => {
      const {
        result: {
          current: { antdNotification },
        },
      } = renderHook(() => useAntdModals())

      antdNotification.error("error-test", { description: "Error message", closable: false })

      expect(mockNotification.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(Object),
          props: { "data-testid": "error-test-notification-error" },
          closable: false,
          placement: "bottom",
          description: null,
          icon: expect.any(Object),
        })
      )
    })
  })
})
