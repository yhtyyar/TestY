import { Modal, notification } from "antd"
import i18n from "i18next"
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { antdModalCloseConfirm, antdModalConfirm, antdNotification } from "./antd-modals"

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd")
  return {
    ...actual,
    Modal: {
      ...actual.Modal,
      confirm: vi.fn(),
    },
    notification: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }
})

describe("antdModalConfirm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls Modal.confirm with proper test ids and props", () => {
    const title = "Confirm something"
    const bodyProps = { className: "custom-body" }

    antdModalConfirm("test", { title, bodyProps })

    expect(Modal.confirm).toHaveBeenCalledWith(
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
    const mockCallback = vi.fn()

    antdModalCloseConfirm(mockCallback)

    expect(Modal.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.any(Object),
        content: i18n.t("You will lose your data if you continue!"),
        onOk: expect.any(Function),
      })
    )

    let onOkFn: () => void = () => {}

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    ;(Modal.confirm as unknown as Mock).mockImplementation((args) => {
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
    antdNotification.success("success-test", { description: "Success message" })

    expect(notification.success).toHaveBeenCalledWith(
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
    antdNotification.error("error-test", { description: "Error message", closable: false })

    expect(notification.error).toHaveBeenCalledWith(
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
