import { Flex, Modal, ModalProps } from "antd"
import { ReactNode } from "react"

import { useAppSelector } from "app/hooks"

import { selectThemeType } from "entities/system/model/slice-theme"

type NyModalProps = ModalProps

export const NyModal = ({ title, ...props }: NyModalProps) => {
  const themeType = useAppSelector(selectThemeType)

  if (themeType !== "dark") {
    return <Modal {...props} />
  }

  const nyTitle: ReactNode = title ? (
    <Flex align="center" gap={8}>
      {title}
    </Flex>
  ) : undefined

  return <Modal title={nyTitle} {...props} />
}
