import { useEffect, useMemo, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useCreateLabelMutation, useUpdateLabelMutation } from "entities/label/api"

import { useAntdModals, useErrors } from "shared/hooks"

const BASE_COLORS = [
  null,
  "#B2D860",
  "#2D7365",
  "#468AA5",
  "#7883E2",
  "#C088FF",
  "#EB76BE",
  "#E4387A",
]

interface ErrorData {
  name?: string
  type?: string
  color?: string
}

export interface UseCreateEditLabelModalProps {
  mode: ModalMode
  isShow: boolean
  setIsShow: (isShow: boolean) => void
  label?: Label
}

export const useCreateEditLabelModal = ({
  mode,
  label,
  setIsShow,
  isShow,
}: UseCreateEditLabelModalProps) => {
  const { t } = useTranslation()
  const { antdNotification } = useAntdModals()
  const { projectId } = useParams<ParamProjectId>()

  const [createLabel, { isLoading: isLoadingCreating }] = useCreateLabelMutation()
  const [updateLabel, { isLoading: isLoadingUpdating }] = useUpdateLabelMutation()

  const [errors, setErrors] = useState<ErrorData | null>(null)
  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const {
    handleSubmit,
    reset,
    control,
    formState: { isDirty },
  } = useForm<LabelUpdate>({
    defaultValues: {
      name: label?.name ?? "",
      type: 0,
      color: BASE_COLORS[0],
    },
  })

  const onSubmit: SubmitHandler<LabelUpdate> = async (data) => {
    setErrors(null)

    try {
      if (mode === "edit" && label && projectId) {
        await updateLabel({
          id: Number(label.id),
          body: data,
        }).unwrap()
      } else {
        await createLabel({ ...data, project: Number(projectId) }).unwrap()
      }
      antdNotification.success(mode === "edit" ? "update-label" : "create-label", {
        description:
          mode === "edit" ? t("Label updated successfully") : t("Label created successfully"),
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

  const handleCancel = () => {
    if (!isLoadingCreating || !isLoadingUpdating) {
      handleCloseModal()
    }
  }

  const title = useMemo(() => {
    if (mode === "create" || !label) {
      return t("Create label")
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `${t("Edit label")} ${label.name}`
  }, [mode, label])

  // use effect for edit modal
  useEffect(() => {
    if (mode !== "edit" || !label) return
    reset({
      name: label.name,
      type: label.type,
      color: label.color,
    })
  }, [mode, label])

  return {
    title,
    isShow,
    control,
    errors,
    isLoading: isLoadingCreating || isLoadingUpdating,
    isDirty,
    BASE_COLORS,
    handleCancel,
    handleSubmitForm: handleSubmit(onSubmit),
  }
}
