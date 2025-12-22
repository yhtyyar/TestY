import { CloseOutlined, CopyOutlined } from "@ant-design/icons"
import { Flex, message } from "antd"
import { useTranslation } from "react-i18next"

import FileLinear from "shared/assets/yi-icons/file-linear.svg?react"

import styles from "./styles.module.css"

interface AttachmentItemProps {
  attachment: IAttachment
  handleAttachmentRemove?: (fileId: number) => void
  id?: string
}

export const AttachmentItemMin = ({
  attachment,
  handleAttachmentRemove,
  id,
}: AttachmentItemProps) => {
  const { t } = useTranslation()

  return (
    <Flex className={styles.row} align="center">
      <FileLinear className={styles.fileIcon} />
      <Flex className={styles.attachNameContainer} align="center">
        <span className={styles.attachName} data-testid={id}>
          {attachment.filename}
        </span>
      </Flex>
      <Flex align="center" gap={4}>
        <CopyOutlined
          onClick={(e) => {
            e.stopPropagation()
            navigator.clipboard.writeText(attachment.link)
            message.info(t("Attachment url copied to clipboard"))
          }}
          className={styles.copyBtn}
          data-testid={`attachment-copy-btn-${id}`}
        />
        {handleAttachmentRemove && (
          <CloseOutlined
            data-testid={`attachment-remove-btn-${id}`}
            onClick={() => handleAttachmentRemove(attachment.id)}
            className={styles.removeBtn}
          />
        )}
      </Flex>
    </Flex>
  )
}
