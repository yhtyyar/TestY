import { CopyOutlined, EditOutlined } from "@ant-design/icons"
import { Tooltip } from "antd"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  testResult: Result
  testCase: TestCase
  isDisabled: boolean
  isClone: boolean
  onClick: (result: Result, testCase: TestCase, isClone: boolean) => void
}

export const EditCloneResult = ({ testResult, isDisabled, isClone, onClick, testCase }: Props) => {
  const { t } = useTranslation()

  return (
    <Button
      id={`${isClone ? "clone" : "edit"}-result-${testResult.id}-button`}
      onClick={(e) => {
        e.stopPropagation()
        onClick(testResult, testCase, isClone)
      }}
      color="ghost"
      className={styles.actionButton}
      disabled={isDisabled}
    >
      {isClone ? (
        <Tooltip placement="topRight" title={t("Clone test result")}>
          <CopyOutlined className={styles.actionIcon} />
        </Tooltip>
      ) : (
        <Tooltip placement="topRight" title={t("Edit Test Result")}>
          <EditOutlined className={styles.actionIcon} />
        </Tooltip>
      )}
    </Button>
  )
}
