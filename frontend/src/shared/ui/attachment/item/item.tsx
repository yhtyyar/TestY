import { CloseOutlined, CopyOutlined, FileOutlined } from "@ant-design/icons"
import { Col, Row, Space, message } from "antd"
import { useTranslation } from "react-i18next"

import { AttachmentItemInfo } from "./item-info"

interface AttachmentItemProps {
  attachment: IAttachment
  handleAttachmentRemove?: (fileId: number) => void
  id?: string
}

export const AttachmentItem = ({ attachment, handleAttachmentRemove, id }: AttachmentItemProps) => {
  const { t } = useTranslation()

  return (
    <Row style={{ border: "1px solid var(--y-color-border)", marginBottom: 8 }} align="middle">
      <Col flex="0 1 60px" style={{ padding: "16px 16px" }}>
        <FileOutlined style={{ color: "#096dd9", fontSize: 32 }} />
      </Col>
      <AttachmentItemInfo id={id} attachment={attachment} />
      <Col flex="0 1 100px" style={{ textAlign: "center" }}>
        <Space>
          <CopyOutlined
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(attachment.link)
              message.info(t("Attachment url copied to clipboard"))
            }}
            style={{ fontSize: 16, cursor: "pointer", color: "#ааа" }}
            data-testid={`attachment-copy-btn-${id}`}
          />
          {handleAttachmentRemove && (
            <CloseOutlined
              data-testid={`attachment-remove-btn-${id}`}
              onClick={() => handleAttachmentRemove(attachment.id)}
              style={{ fontSize: 16, cursor: "pointer", color: "#eb2f96" }}
            />
          )}
        </Space>
      </Col>
    </Row>
  )
}
