import { Alert, Flex, Form, Select } from "antd"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { LabelSelectWithAdd } from "entities/label/ui"

import { ErrorObj, useAntdModals, useErrors } from "shared/hooks"
import { AlertError, Button } from "shared/ui"
import { NyModal } from "shared/ui/ny-modal/ny-modal"

import styles from "./styles.module.css"

interface Props {
  isShow: boolean
  onClose: () => void
  onSubmit: (labels: SelectedLabel[], operationType: ChangeLabelBulkOperationType) => Promise<void>
  selectedCount: number
}

interface ErrorData {
  labels?: string
}

const BULK_OPERATION_TYPES = ["add", "update", "delete", "clear"] as const
const TEST_ID = "change-bulk-label"

type BulkOperation = (typeof BULK_OPERATION_TYPES)[number]

export const ChangeBulkLabelModal = ({ isShow, onClose, selectedCount, onSubmit }: Props) => {
  const { t } = useTranslation()
  const { antdNotification } = useAntdModals()
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation>("add")
  const [selectedLabels, setSelectedLabels] = useState<SelectedLabel[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const { onHandleError } = useErrors<ErrorData>(setErrors)

  const operationsLabel = {
    add: t("Add to existing"),
    update: t("Replace all with new"),
    delete: t("Find and remove label"),
    clear: t("Remove all labels"),
  }

  const operationOptions = BULK_OPERATION_TYPES.map((operation) => ({
    label: operationsLabel[operation],
    value: operation,
  }))

  useEffect(() => {
    setSelectedLabels([])
  }, [selectedOperation])

  const handleSubmit = async () => {
    setErrors(null)
    try {
      setIsUpdating(true)

      const operation = selectedOperation === "clear" ? "update" : selectedOperation

      await onSubmit(selectedLabels, operation)

      antdNotification.success("change-bulk-label", {
        description: t("Labels changed successfully"),
      })
      onClose()
    } catch (err) {
      onHandleError(err)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <NyModal
      title={
        <div className={styles.header}>
          <div className={styles.title}>{t("Change Labels")}</div>
          <div className={styles.subTitle}>{`${selectedCount} ${t("Items")}`}</div>
        </div>
      }
      open={isShow}
      onCancel={onClose}
      centered
      width={478}
      styles={{
        content: { padding: "20px 0 16px", height: "100%" },
        body: { minHeight: 296 },
        header: { margin: 0 },
      }}
      footer={[
        <div key="footer" className={styles.formFooter}>
          <Button
            data-testid="close-bulk-add-labels-modal"
            onClick={onClose}
            loading={isUpdating}
            color="secondary-linear"
          >
            {t("Cancel")}
          </Button>
          <Button
            data-testid="submit-bulk-add-labels-modal"
            loading={isUpdating}
            onClick={handleSubmit}
            disabled={selectedLabels.length === 0 && selectedOperation !== "clear"}
            color="accent"
          >
            {t("Submit")}
          </Button>
        </div>,
      ]}
    >
      {errors ? <AlertError error={errors as ErrorObj} /> : null}
      <Flex vertical style={{ padding: "24px" }} justify={"start"}>
        <Form.Item label={t("Action")} layout="vertical">
          <Select
            data-testid={`${TEST_ID}-action-select`}
            onSelect={(operation) => setSelectedOperation(operation as BulkOperation)}
            value={selectedOperation}
            style={{ width: "100%" }}
            options={operationOptions}
          />
        </Form.Item>
        {selectedOperation !== "clear" && (
          <Form.Item label={t("Labels")} layout="vertical">
            <LabelSelectWithAdd
              id="bulk-add-label-list"
              value={selectedLabels}
              onChange={setSelectedLabels}
              noAdding={selectedOperation === "delete"}
            />
          </Form.Item>
        )}
        {selectedOperation === "clear" && (
          <Alert message={t("All labels of the selected entities will be removed")} banner />
        )}
      </Flex>
    </NyModal>
  )
}
