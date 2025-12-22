import { CloseCircleOutlined } from "@ant-design/icons"
import { App, ModalFuncProps } from "antd"
import { ArgsProps } from "antd/es/notification"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import TickIcon from "shared/assets/yi-icons/tick.svg?react"

import styles from "./styles.module.css"

type NotificationProps = Omit<ArgsProps, "message" | "description"> & {
  description?: string | React.ReactNode
  closable?: boolean
}

export const useAntdModals = () => {
  const { t } = useTranslation()
  const { modal, notification } = App.useApp()

  const antdModalConfirm = useCallback(
    (
      id: string,
      {
        okText = t("Ok"),
        cancelText = t("Cancel"),
        title,
        okButtonProps,
        cancelButtonProps,
        bodyProps,
        ...props
      }: ModalFuncProps
    ) => {
      return modal.confirm({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        bodyProps: { "data-testid": `${id}-modal-confirm`, ...bodyProps },
        okButtonProps: { "data-testid": `${id}-button-confirm`, ...okButtonProps },
        cancelButtonProps: { "data-testid": `${id}-button-cancel`, ...cancelButtonProps },
        title: <span data-testid={`${id}-modal-title`}>{title}</span>,
        okText,
        cancelText,
        ...props,
      })
    },
    []
  )

  const antdModalCloseConfirm = useCallback(
    (cb: () => void) => {
      antdModalConfirm("close-modal-confirm", {
        title: t("Do you want to close?"),
        content: t("You will lose your data if you continue!"),
        onOk: () => cb(),
      })
    },
    [antdModalConfirm, t]
  )

  const antdNotification = useMemo(
    () => ({
      success: (id: string, props?: NotificationProps) => {
        const { description, closable = true, ...rest } = props ?? {}
        return notification.success({
          message: <div data-testid={`${id}-notification-success-message`}>{description}</div>,
          props: {
            "data-testid": `${id}-notification-success`,
          },
          closable,
          placement: "bottom",
          className: styles.notificationWrapper,
          description: null,
          icon: <TickIcon />,
          ...rest,
        })
      },
      error: (id: string, props?: NotificationProps) => {
        const { description, closable = true, ...rest } = props ?? {}
        return notification.error({
          message: <span data-testid={`${id}-notification-error-message`}>{description}</span>,
          props: {
            "data-testid": `${id}-notification-error`,
          },
          closable,
          placement: "bottom",
          className: styles.notificationWrapper,
          description: null,
          icon: <CloseCircleOutlined style={{ color: "var(--y-color-error)" }} />,
          ...rest,
        })
      },
    }),
    []
  )

  const initInternalError = useCallback(
    (err: unknown) => {
      console.error(err)
      antdNotification.error("init-internal-error", {
        description: t("Internal server error. Showing in console log."),
      })
    },
    [antdNotification, t]
  )

  return {
    antdModalConfirm,
    antdModalCloseConfirm,
    initInternalError,
    antdNotification,
  }
}
