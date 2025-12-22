import { UploadChangeParam, UploadFile } from "antd/lib/upload"
import { Mutex } from "async-mutex"
import type { UploadRequestError, UploadRequestOption } from "rc-upload/lib/interface"
import { useEffect, useState } from "react"
import { Control, FieldValues, useFieldArray } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useCreateAttachmentMutation } from "entities/attachment/api"

import { useAntdModals } from "shared/hooks"

const mutex = new Mutex()

interface UploadFileExtend<T> extends UploadFile<T> {
  id?: number
  link?: string
  filename?: string
  size_humanize?: string
}

// prettier-ignore
export const useAttachments = <T, >(
  control: Control<T & FieldValues, unknown>,
  projectId: number,
  fieldName = "attachments"
) => {
  const { t } = useTranslation()
  const { antdNotification, initInternalError } = useAntdModals()
  const [attachments, setAttachments] = useState<IAttachmentWithUid[]>([])
  const [createAttachment, { isLoading }] = useCreateAttachmentMutation()
  const {
    fields: attachmentsIds,
    append: appendAttachmentIds,
    remove: removeAttachmentIds,
  } = useFieldArray({ name: fieldName, control: control as Control<FieldValues> })

  useEffect(() => {
    removeAttachmentIds()
    appendAttachmentIds(attachments.map(({ id }: IAttachmentWithUid) => id))
  }, [attachments])

  const onRemove = (fileId: number) => {
    setAttachments(attachments.filter(({ id }: IAttachment) => id !== fileId))
  }

  const onLoad = async (options: UploadRequestOption<unknown>) => {
    const { onSuccess, onError, file } = options
    const fileFormat = file as UploadFileExtend<IAttachmentWithUid[]>

    if (!projectId || !onSuccess || !onError) {
      antdNotification.error("use-attachments", {
        description: t("ProjectId is undefined"),
      })
      return
    }

    const fmData = new FormData()
    fmData.append("file", file)
    fmData.append("project", String(projectId))

    await mutex.waitForUnlock()
    const release = await mutex.acquire()

    try {
      const response = await createAttachment(fmData).unwrap()
      fileFormat.id = response[0].id
      fileFormat.link = response[0].link
      fileFormat.filename = response[0].filename
      fileFormat.size_humanize = response[0].size_humanize
      onSuccess(t("Ok"))
    } catch (err) {
      const error = err as UploadRequestError
      initInternalError(err)
      onError(error)
    } finally {
      release()
    }
  }

  const onChange = (info: UploadChangeParam<UploadFileExtend<IAttachmentWithUid[]>>) => {
    const fileList = (info.fileList as IAttachmentWithUid[]).map((f) => ({ ...f, filename: f.status === "uploading" ? f.name : f.filename }))
    setAttachments(fileList)
  }

  const onReset = () => {
    removeAttachmentIds()
    setAttachments([])
  }

  return {
    onLoad,
    onRemove,
    onChange,
    setAttachments,
    removeAttachmentIds,
    onReset,
    attachmentsIds,
    attachments,
    isLoading,
  }
}
