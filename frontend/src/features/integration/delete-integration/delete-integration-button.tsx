import { DeleteOutlined } from "@ant-design/icons"
import { useDeleteIntegrationMutation } from "entities/integrations/api"
import { useTranslation } from "react-i18next"

import { useAntdModals } from "shared/hooks"
import { Button } from "shared/ui"

interface Props {
  integration: IntegrationEntity
}

export const DeleteIntegrationButton = ({ integration }: Props) => {
  const { t } = useTranslation()
  const { antdNotification, antdModalConfirm, initInternalError } = useAntdModals()
  const [deleteIntegration] = useDeleteIntegrationMutation()

  const handleDelete = () => {
    antdModalConfirm("delete-integration", {
      title: t("Do you want to delete this integration?"),
      okText: t("Delete"),
      onOk: async () => {
        try {
          await deleteIntegration(Number(integration.id)).unwrap()
          antdNotification.success("delete-integration", {
            description: t("Integration deleted successfully"),
          })
        } catch (err: unknown) {
          initInternalError(err)
        }
      },
    })
  }

  return (
    <Button
      id={`${integration.name}-delete-integration-button`}
      icon={<DeleteOutlined />}
      shape="circle"
      danger
      color="secondary-linear"
      onClick={handleDelete}
    />
  )
}
