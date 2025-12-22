import { DownloadOutlined } from "@ant-design/icons"
import { Col, Flex } from "antd"

import { canViewAttachment } from "entities/attachment/model/utils"

interface Props {
  id?: string
  attachment: IAttachment
}

export const AttachmentItemInfo = ({ id, attachment }: Props) => {
  return (
    <Col
      flex="1 1"
      style={{
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      <a
        target="_blank"
        rel="noreferrer"
        href={`${attachment.link}?view=${canViewAttachment(attachment.filename) ? "true" : "false"}`}
        style={{ margin: 0, fontSize: 13 }}
        data-testid={id}
      >
        {attachment.filename}
      </a>
      <Flex gap={6} align="center">
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "#828282",
          }}
        >
          {attachment.size_humanize}
        </p>
        <a target="_blank" rel="noreferrer" href={attachment.link} download={attachment.name}>
          <DownloadOutlined style={{ color: "#096dd9", fontSize: 14 }} />
        </a>
      </Flex>
    </Col>
  )
}
