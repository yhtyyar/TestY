import { PictureOutlined } from "@ant-design/icons"
import { Input, Upload } from "antd"
import { UploadFileStatus } from "antd/es/upload/interface"
import { TextAreaProps } from "antd/lib/input/TextArea"
import { UploadChangeParam, UploadFile } from "antd/lib/upload"
import type { UploadRequestOption } from "rc-upload/lib/interface"
import { CSSProperties, useEffect, useRef, useState } from "react"
import { UseFormSetValue } from "react-hook-form"

import { Button, MarkdownViewer, MarkdownViewerTabs } from ".."
import styles from "./styles.module.css"

interface IAttachmentWithStatus extends IAttachmentWithUid {
  status: UploadFileStatus
}

interface UploadFileExtend<T> extends UploadFile<T> {
  id?: number
  link?: string
}

interface TSTextAreaProps {
  uploadId?: string
  textAreaId?: string
  fieldProps: TextAreaProps
  stateAttachments: {
    attachments: IAttachmentWithUid[]
    setAttachments: React.Dispatch<React.SetStateAction<IAttachmentWithUid[]>>
  }
  customRequest: (options: UploadRequestOption<unknown>) => Promise<void>
  // TODO fix it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>
  style?: CSSProperties
}

type ViewTab = "md" | "view"

export const TextAreaWithAttach = ({
  uploadId = "text-area-with-attach",
  textAreaId = "text-area-with-attach",
  fieldProps,
  stateAttachments,
  customRequest,
  setValue,
  style,
}: TSTextAreaProps) => {
  const [tab, setTab] = useState<ViewTab>("md")
  const [textAreaHeight, setTextAreaHeight] = useState<number | null>(null)
  const { attachments, setAttachments } = stateAttachments
  const uploadRef = useRef(null)

  const onChange = (info: UploadChangeParam<UploadFileExtend<IAttachmentWithStatus[]>>) => {
    setAttachments(
      (info.fileList as IAttachmentWithStatus[]).map((f) => ({
        ...f,
        filename: f?.status ? f.name : f.filename,
      }))
    )

    const { status } = info.file as IAttachmentWithStatus
    if (status === "done" && fieldProps.name) {
      const value = `${(fieldProps.value as string) ?? ""}![](${info.file.link})`
      setValue(fieldProps.name, value, {
        shouldDirty: true,
      })
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const { files } = e.clipboardData
    if (!files.length) return
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    uploadRef.current.upload.uploader.uploadFiles(files)
  }

  const handleTabClick = (newTab: ViewTab) => {
    setTab(newTab)
  }

  useEffect(() => {
    const el = document.querySelector(`#${textAreaId}`)

    function textAreaResize() {
      if (!el || el.clientHeight === 0) return
      setTextAreaHeight(el?.clientHeight ?? 0)
    }

    let resizeObserver: ResizeObserver
    if (el) {
      resizeObserver = new ResizeObserver(textAreaResize)
      resizeObserver.observe(el)
    }
    return () => resizeObserver?.disconnect()
  }, [textAreaId])

  return (
    <>
      <Input.TextArea
        id={textAreaId}
        style={{
          fontSize: 13,
          display: tab === "md" ? "inline-block" : "none",
          ...fieldProps.style,
        }}
        rows={4}
        {...fieldProps}
        onPasteCapture={handlePaste}
      />
      <MarkdownViewer
        tab={tab}
        textAreaHeight={textAreaHeight}
        value={fieldProps.value as string}
        style={style}
      />
      <div id={`${textAreaId}-bottom`} className={styles.row}>
        <MarkdownViewerTabs id={textAreaId} tab={tab} handleTabClick={handleTabClick} />
        <Upload
          ref={uploadRef}
          id={`${uploadId}-upload-attachment-input`}
          fileList={attachments}
          customRequest={customRequest}
          onChange={onChange}
          name="file"
          multiple
          showUploadList={false}
        >
          <Button
            id={`${uploadId}-upload-attachment-button`}
            icon={<PictureOutlined />}
            size="s"
            color="ghost"
            shape="square"
            className={styles.pictureIcon}
          />
        </Upload>
      </div>
    </>
  )
}
