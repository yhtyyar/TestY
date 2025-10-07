import { PlusOutlined } from "@ant-design/icons"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"

import { CreateEditIntegrationModal } from "../create-edit-integration-modal/create-edit-integration-modal"

export const CreateIntegrationButton = () => {
  const { t } = useTranslation()
  const [isShow, setIsShow] = useState(false)

  const handleShow = () => {
    setIsShow(true)
  }

  return (
    <>
      <Button
        id="create-integration-button"
        color="accent"
        icon={<PlusOutlined />}
        onClick={handleShow}
        style={{ marginBottom: 16, float: "right" }}
      >
        {t("Create Integration")}
      </Button>
      <CreateEditIntegrationModal mode="create" isShow={isShow} setIsShow={setIsShow} />
    </>
  )
}
