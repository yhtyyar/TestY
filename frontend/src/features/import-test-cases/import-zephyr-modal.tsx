import { InboxOutlined } from "@ant-design/icons"
import { Alert, Modal, Progress, Typography, Upload, message } from "antd"
import type { UploadFile } from "antd"
import React, { useState } from "react"
import { useTranslation } from "react-i18next"

import { useAppDispatch } from "app/hooks"

import { suiteInvalidate } from "entities/suite/api"

import { systemStatsInvalidate } from "entities/system/api"

import { testSuiteTestCasesInvalidate } from "entities/test-case/api"

import { useImportZephyrMutation, ZephyrImportResponse } from "./api"

const { Dragger } = Upload
const { Text } = Typography

interface ImportZephyrModalProps {
  open: boolean
  onClose: () => void
  projectId: number
  rootSuiteId?: number | null
}

export const ImportZephyrModal: React.FC<ImportZephyrModalProps> = ({
  open,
  onClose,
  projectId,
  rootSuiteId,
}) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [importZephyr, { isLoading }] = useImportZephyrMutation()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [result, setResult] = useState<ZephyrImportResponse | null>(null)
  const [progress, setProgress] = useState(0)

  const handleImport = async () => {
    if (fileList.length === 0) {
      message.warning(t("Please select a file"))
      return
    }

    const file = fileList[0]
    if (!file.originFileObj) return

    const formData = new FormData()
    formData.append("file", file.originFileObj)
    formData.append("project_id", String(projectId))
    if (rootSuiteId) {
      formData.append("root_suite_id", String(rootSuiteId))
    }

    setProgress(10)

    try {
      const response = await importZephyr(formData).unwrap()
      setProgress(100)
      setResult(response as ZephyrImportResponse)
      message.success(
        t("Import completed: {{cases}} test cases, {{suites}} suites created", {
          cases: (response as ZephyrImportResponse).cases_created,
          suites: (response as ZephyrImportResponse).suites_created,
        })
      )
      dispatch(suiteInvalidate())
      dispatch(systemStatsInvalidate)
      dispatch(testSuiteTestCasesInvalidate)
    } catch (error) {
      setProgress(0)
      message.error(t("Import failed. Please check the file format."))
    }
  }

  const handleClose = () => {
    setFileList([])
    setResult(null)
    setProgress(0)
    onClose()
  }

  return (
    <Modal
      title={t("Import Test Cases from Zephyr Scale")}
      open={open}
      onOk={result ? handleClose : handleImport}
      onCancel={handleClose}
      okText={result ? t("Close") : t("Import")}
      confirmLoading={isLoading}
      okButtonProps={{ disabled: fileList.length === 0 && !result }}
      width={600}
      destroyOnClose
    >
      {!result ? (
        <>
          <Dragger
            accept=".xlsx,.xls"
            fileList={fileList}
            maxCount={1}
            beforeUpload={(file) => {
              setFileList([file as unknown as UploadFile])
              return false
            }}
            onRemove={() => {
              setFileList([])
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">{t("Click or drag Zephyr Scale XLSX file here")}</p>
            <p className="ant-upload-hint">
              {t("Supports Zephyr Scale (Jira) test case export in .xlsx format")}
            </p>
          </Dragger>

          {isLoading && (
            <Progress
              percent={progress}
              status="active"
              style={{ marginTop: 16 }}
            />
          )}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Alert
            type="success"
            message={t("Import completed successfully")}
            description={
              <div>
                <Text>{t("Suites created")}: <Text strong>{result.suites_created}</Text></Text>
                <br />
                <Text>{t("Test cases created")}: <Text strong>{result.cases_created}</Text></Text>
                <br />
                <Text>{t("Steps created")}: <Text strong>{result.steps_created}</Text></Text>
              </div>
            }
          />

          {result.errors.length > 0 && (
            <Alert
              type="warning"
              message={t("{{count}} test cases had errors", { count: result.errors.length })}
              description={
                <div style={{ maxHeight: 200, overflow: "auto" }}>
                  {result.errors.map((err: { key: string; error: string }, idx: number) => (
                    <div key={idx}>
                      <Text type="danger">{err.key}: {err.error}</Text>
                    </div>
                  ))}
                </div>
              }
            />
          )}
        </div>
      )}
    </Modal>
  )
}
