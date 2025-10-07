import { EditOutlined } from "@ant-design/icons"
import { useState } from "react"

import { Button } from "shared/ui"

import { CreateEditIntegrationModal } from "../create-edit-integration-modal/create-edit-integration-modal"

interface Props {
  integration: IntegrationEntity
}

export const EditIntegrationButton = ({ integration }: Props) => {
  const [isShow, setIsShow] = useState(false)

  const handleShow = () => {
    setIsShow(true)
  }

  return (
    <>
      <Button
        id={`${integration.name}-edit-integration-button`}
        icon={<EditOutlined />}
        shape="circle"
        color="secondary-linear"
        onClick={handleShow}
      />
      <CreateEditIntegrationModal
        mode="edit"
        integration={integration}
        isShow={isShow}
        setIsShow={setIsShow}
      />
    </>
  )
}
