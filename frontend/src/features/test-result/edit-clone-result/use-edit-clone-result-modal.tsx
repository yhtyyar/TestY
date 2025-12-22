import { useStatuses } from "entities/status/model/use-statuses"
import { useEffect, useMemo, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useAttachments } from "entities/attachment/model"

import { useCreateResultMutation, useUpdateResultMutation } from "entities/result/api"
import { useAttributesTestResult } from "entities/result/model"

import { useProjectContext } from "pages/project"

import { useAntdModals, useErrors } from "shared/hooks"
import { makeAttributesJson } from "shared/libs"
import { AlertSuccessChange } from "shared/ui"

import { filterAttributesByStatus } from "../utils"

interface ErrorData {
  status?: string
  comment?: string
  attributes?: string | null
}

interface UseEditResultModalProps {
  onCancel: () => void
  testResult: Result
  isClone: boolean
  onSubmit?: (newResult: Result, oldResult: Result) => void
  onDirtyChange: (dirty: boolean) => void
}

export const useEditCloneResultModal = ({
  onCancel,
  testResult,
  isClone,
  onSubmit: onSubmitCb,
  onDirtyChange,
}: UseEditResultModalProps) => {
  const { t } = useTranslation()
  const { antdModalCloseConfirm, antdNotification } = useAntdModals()
  const project = useProjectContext()
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    register,
    formState: { isDirty },
    watch,
  } = useForm<ResultFormData>({
    mode: "all",
    defaultValues: {
      comment: testResult.comment,
      status: testResult.status,
      attributes: [],
      steps: {},
      attachments: testResult.attachments.map(({ id }) => id),
    },
  })
  const watchStatus = watch("status")
  const watchSteps = watch("steps") ?? {}

  const { testPlanId } = useParams<ParamTestPlanId>()
  const { statuses, getStatusById, statusesOptions } = useStatuses({
    project: project.id,
  })
  const {
    setAttachments,
    onReset,
    onRemove,
    onLoad,
    onChange,
    removeAttachmentIds,
    attachments,
    attachmentsIds,
    isLoading: isLoadingCreateAttachment,
  } = useAttachments<ResultFormData>(control, project.id)

  const { onHandleError } = useErrors<ErrorData>(setErrors)
  const [updatedTestResult, { isLoading: isLoadingUpdateTestResult }] = useUpdateResultMutation()
  const [createResult, { isLoading: isLoadingCreateTestResult }] = useCreateResultMutation()
  const isLoading =
    isLoadingUpdateTestResult || isLoadingCreateTestResult || isLoadingCreateAttachment

  const {
    attributes: allAttributes,
    initAttributes,
    setAttributes,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
    getAttributeJson,
  } = useAttributesTestResult({ mode: "edit", setValue })

  const allAttributesSortedByStatus = useMemo(() => {
    if (!allAttributes.length) return []
    return filterAttributesByStatus(allAttributes, statuses, watchStatus)
  }, [allAttributes, watchStatus, statuses])

  const isStatusAvailable = (status: number) => !!getStatusById(status)

  useEffect(() => {
    onDirtyChange(isDirty)
  }, [isDirty])

  useEffect(() => {
    // Set attachments if exists
    if (testResult.attachments) {
      const testResultAttachesWithUid = testResult.attachments.map((attach) => ({
        ...attach,
        uid: String(attach.id),
      }))
      setAttachments(testResultAttachesWithUid)
      setValue(
        "attachments",
        testResult.attachments.map((i) => i.id)
      )
    }

    // Set steps if exists
    if (testResult.steps_results.length && statuses.length) {
      const resultSteps = testResult.steps_results.reduce(
        (acc, stepResult) => {
          if (isStatusAvailable(stepResult.status)) {
            acc[String(stepResult.id)] = stepResult.status
          }
          return acc
        },
        {} as Record<string, number>
      )

      setValue("steps", resultSteps)
    }

    // Set attributes if exists
    if (initAttributes.length) {
      const attrs = getAttributeJson(testResult.attributes)
      setAttributes(attrs)
      setValue("attributes", attrs)
    }
  }, [testResult, statuses, initAttributes])

  const onCloseView = () => {
    onCancel()
    setErrors(null)
    reset()
    removeAttachmentIds()
    setAttributes([])
    onReset()
  }

  const handleCancel = () => {
    if (isLoading) return

    if (isDirty) {
      antdModalCloseConfirm(onCloseView)
      return
    }

    onCloseView()
  }

  const onSubmit: SubmitHandler<ResultFormData> = async (data) => {
    if (!testResult) return
    setErrors(null)

    const {
      isSuccess,
      attributesJson,
      errors: attributesErrors,
    } = makeAttributesJson(allAttributesSortedByStatus)

    if (!isSuccess) {
      setErrors({ attributes: JSON.stringify(attributesErrors) })
      return
    }

    const stepsResultData: { id: string; status: number }[] = []

    if (Object.keys(watchSteps).length) {
      Object.entries(watchSteps).forEach(([id, status]) => {
        stepsResultData.push({ id, status })
      })
    }

    try {
      const dataReq = {
        ...data,
        attributes: attributesJson,
        steps_results: stepsResultData,
        test: testResult.test,
      }
      let newResult = null
      if (!isClone) {
        newResult = await updatedTestResult({
          id: testResult.id,
          testPlanId: testPlanId ? Number(testPlanId) : null,
          body: dataReq as ResultUpdate,
        }).unwrap()
      } else {
        const findStep = (id: string) =>
          testResult.steps_results.find((i) => i.id === parseInt(id))?.step
        const stepsResultCreate = stepsResultData
          .map((i) => {
            return { step: findStep(i.id), status: i.status }
          })
          .filter((i) => i.step !== undefined) as StepResultCreate[]
        newResult = await createResult({
          testPlanId: testPlanId ? Number(testPlanId) : null,
          body: { ...dataReq, steps_results: stepsResultCreate } as ResultCreate,
        }).unwrap()
      }
      onCloseView()

      antdNotification.success("edit-clone-result", {
        description: (
          <AlertSuccessChange
            action="updated"
            title={t("Result")}
            link={`/projects/${project.id}/plans/${testPlanId}/?test=${newResult.test}#result-${newResult.id}`}
            id={String(newResult.id)}
          />
        ),
      })
      onSubmitCb?.(newResult, testResult)
    } catch (err: unknown) {
      onHandleError(err)
    }
  }

  const handleStepsChange = (stepsResult: Record<string, number>) => {
    setValue("steps", stepsResult, { shouldDirty: true })
  }

  const isAllStepsSelected = testResult.steps_results.every((result) => watchSteps[result.id])
  const isDisabledSubmit = (!isDirty && !isClone) || !isAllStepsSelected || !watchStatus

  return {
    isLoading,
    errors,
    control,
    attachments,
    attachmentsIds,
    watchSteps,
    isDirty,
    hasSteps: !!testResult.steps_results?.length,
    statusesOptions,
    setAttachments,
    handleStepsChange,
    handleAttachmentsChange: onChange,
    handleAttachmentsLoad: onLoad,
    handleAttachmentsRemove: onRemove,
    setValue,
    handleCancel,
    register,
    attributes: allAttributesSortedByStatus,
    setAttributes,
    addAttribute,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeChangeName,
    onAttributeRemove,
    handleSubmitForm: handleSubmit(onSubmit),
    statuses,
    isDisabledSubmit,
  }
}
