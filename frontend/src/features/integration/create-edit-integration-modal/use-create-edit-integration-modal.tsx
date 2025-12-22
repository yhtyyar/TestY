import { Modal } from "antd"
import {
  useCreateIntegrationMutation,
  useUpdateIntegrationMutation,
} from "entities/integrations/api"
import { useEffect, useMemo, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useAntdModals, useErrors } from "shared/hooks"

const { confirm } = Modal

interface ErrorData {
  name?: string
  description?: string
  service_url?: string
  is_new_tab?: string
}

export interface UseCreateEditIntegrationModalProps {
  mode: ModalMode
  isShow: boolean
  setIsShow: (isShow: boolean) => void
  integration?: IntegrationEntity
}

export const useCreateEditIntegrationModal = ({
  mode,
  integration,
  setIsShow,
  isShow,
}: UseCreateEditIntegrationModalProps) => {
  const { t } = useTranslation()
  const { antdNotification } = useAntdModals()
  const { projectId } = useParams<ParamProjectId>()

  const [createIntegration, { isLoading: isLoadingCreating }] = useCreateIntegrationMutation()
  const [updateIntegration, { isLoading: isLoadingUpdating }] = useUpdateIntegrationMutation()

  const defaultValues = useMemo(() => {
    return {
      name: integration?.name ?? "",
      description: integration?.description ?? "",
      service_url: integration?.service_url ?? "",
      is_new_tab: integration?.is_new_tab ?? true,
      project: Number(projectId),
      page_type: "testplan" as const,
    }
  }, [integration])

  const [errors, setErrors] = useState<ErrorData | null>(null)
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const {
    handleSubmit,
    reset,
    control,
    watch,
    formState: { isDirty, isValid },
  } = useForm<IntegrationUpdate>({
    mode: "onChange",
    defaultValues,
  })

  const watchName = watch("name")
  const watchUrl = watch("service_url")

  const onSubmit: SubmitHandler<IntegrationUpdate> = async (data) => {
    setErrors(null)

    try {
      if (mode === "edit" && integration) {
        await updateIntegration({
          id: Number(integration.id),
          body: { ...data, page_type: data.page_type ?? "testplan" },
        }).unwrap()
      } else {
        await createIntegration({
          ...data,
          project: Number(projectId),
          page_type: data.page_type ?? "testplan",
        }).unwrap()
      }
      antdNotification.success(mode === "edit" ? "update-integration" : "create-integration", {
        description:
          mode === "edit"
            ? t("Integration updated successfully")
            : t("Integration created successfully"),
      })
      handleCloseModal()
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleCloseModal = () => {
    setErrors(null)
    reset()
    setIsShow(false)
  }

  const handleResetError = (field: keyof ErrorData) => {
    if (!errors?.[field]) {
      return
    }

    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleCancel = () => {
    if (!isLoadingCreating || !isLoadingUpdating) {
      handleCloseModal()
    }
  }

  const handleConfirmClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (
      isDirty &&
      !isLoadingCreating &&
      !isLoadingUpdating &&
      (e.target as HTMLDivElement).classList.contains("ant-modal-wrap")
    ) {
      confirm({
        title: t("Do you want to close modal?"),
        content: t("Unsaved data will be lost"),
        onOk() {
          handleCloseModal()
        },
      })
    } else {
      handleCancel()
    }
  }

  const title = useMemo(() => {
    if (mode === "create" || !integration) {
      return t("Create Integration")
    }
    return t("Edit Integration")
  }, [mode, integration])

  useEffect(() => {
    if (!isShow || mode !== "edit" || !integration) return

    reset(defaultValues)
  }, [mode, integration])

  return {
    title,
    isShow,
    control,
    errors,
    isLoading: isLoadingCreating || isLoadingUpdating,
    isDisabled: !isDirty || !isValid || !watchName || !watchUrl,
    handleConfirmClose,
    handleCancel,
    handleResetError,
    handleSubmitForm: handleSubmit(onSubmit),
  }
}
