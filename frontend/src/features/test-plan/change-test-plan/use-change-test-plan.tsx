import dayjs from "dayjs"
import { useTreebarProvider } from "processes/treebar-provider"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { useAttachments } from "entities/attachment/model"

import { useGetParametersQuery } from "entities/parameter/api"

import {
  useCreateTestPlanMutation,
  useGetTestPlanCasesQuery,
  useLazyGetTestPlanQuery,
  useUpdateTestPlanMutation,
} from "entities/test-plan/api"
import { useAttributesTestPlan } from "entities/test-plan/model"

import { useProjectContext } from "pages/project"

import { useAntdModals, useConfirmBeforeRedirect, useDatepicker, useErrors } from "shared/hooks"
import { makeAttributesJson, makeParametersForTreeView } from "shared/libs"
import { AlertSuccessChange } from "shared/ui"
import { arrayOfStringToObject, objectToArrayOfString } from "shared/ui/tree/utils"

type TabType = "general" | "attachments"

export interface ErrorData {
  name?: string
  description?: string
  parent?: string
  test_cases?: string
  started_at?: string
  due_date?: string
  parameters?: string
  attributes?: string
}

interface LocationState {
  testPlan?: TestPlan
}

export type ChangeTestPlanForm = Modify<
  TestPlanCreate,
  {
    started_at: dayjs.Dayjs
    due_date: dayjs.Dayjs
    attributes: Attribute[]
    test_cases: Record<string, boolean>
  }
>

interface Props {
  type: "create" | "edit"
}

const formDefaultVales = {
  name: "",
  description: "",
  parent: null,
  test_cases: {},
  parameters: [],
  started_at: dayjs(),
  due_date: dayjs().add(1, "day"),
  attributes: [],
  attachments: [],
}

const filterTestCases = (data: string[]) => {
  return data.filter((item) => !item.startsWith("TS"))
}

export const useChangeTestPlan = ({ type }: Props) => {
  const { t } = useTranslation()
  const { antdModalCloseConfirm, antdNotification } = useAntdModals()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const project = useProjectContext()
  const navigate = useNavigate()
  const state = location.state as LocationState | null
  const { treebar } = useTreebarProvider()

  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty, errors: formErrors },
    register,
    watch,
  } = useForm<ChangeTestPlanForm>({
    defaultValues: formDefaultVales,
  })

  const { setDateFrom, setDateTo, disabledDateTo } = useDatepicker()
  const {
    attachments,
    attachmentsIds,
    isLoading: isLoadingAttachments,
    setAttachments,
    onLoad: handleAttachmentLoad,
    onRemove: handleAttachmentRemove,
    onChange: handleAttachmentChange,
  } = useAttachments<ChangeTestPlanForm>(control, project.id)

  const {
    attributes,
    isLoading: isLoadingAttributes,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
    getAttributeJson,
    setAttributes,
  } = useAttributesTestPlan({ mode: type, setValue })

  const { setIsRedirectByUser } = useConfirmBeforeRedirect({
    isDirty,
    pathname: type === "create" ? "new-test-plan" : "edit-test-plan",
  })

  const [stateTestPlan, setStateTestPlan] = useState<TestPlan | null>(state?.testPlan ?? null)
  const [parametersTreeView, setParametersTreeView] = useState<IParameterTreeView[]>([])

  const [selectedParent, setSelectedParent] = useState<{ label: string; value: number } | null>(
    null
  )
  const [tab, setTab] = useState<TabType>("general")
  const [errors, setErrors] = useState<ErrorData | null>(null)
  const { onHandleError } = useErrors<ErrorData>(setErrors)

  const { data: parameters } = useGetParametersQuery(project.id)
  const [getTestPlan, { isLoading: isLoadingGetTestPlan }] = useLazyGetTestPlanQuery()
  const [createTestPlan, { isLoading: isLoadingCreateTestPlan }] = useCreateTestPlanMutation()
  const [updateTestPlan, { isLoading: isLoadingUpdateTestPlan }] = useUpdateTestPlanMutation()
  const { data: tests, isLoading: isLoadingTestCases } = useGetTestPlanCasesQuery(
    {
      testPlanId: String(stateTestPlan?.id),
    },
    { skip: type === "create" && !stateTestPlan }
  )

  const refetchParentAfterCreate = async (updatedEntity: TestPlan) => {
    await treebar.current.rowRefetch(
      !updatedEntity.parent ? null : updatedEntity.parent.id.toString()
    )
  }

  const refetchParentAfterEdit = async (updatedEntity: TestPlan, oldEntity: TestPlan) => {
    if (!updatedEntity.parent || !oldEntity.parent) {
      await treebar.current.initRoot()
      return
    }

    if (updatedEntity.parent.id === oldEntity.parent.id) {
      await treebar.current.rowRefetch(updatedEntity.parent.id.toString())
      return
    }

    await treebar.current.rowRefetch(updatedEntity.parent.id.toString())
    await treebar.current.rowRefetch(oldEntity.parent.id.toString())
  }

  const handleTabChange = (activeKey: string) => {
    setTab(activeKey as TabType)
  }

  const clear = () => {
    setErrors(null)
    reset(formDefaultVales)
  }

  const redirectToPrev = () => {
    setIsRedirectByUser()
    clear()
    const prevUrl = searchParams.get("prevUrl")
    navigate(prevUrl ?? `/projects/${project.id}/plans/${stateTestPlan?.id ?? ""}`)
  }

  const handleCancel = () => {
    if (isDirty) {
      antdModalCloseConfirm(redirectToPrev)
      return
    }
    redirectToPrev()
  }

  const redirectToPlan = (testPlanId?: number) => {
    setIsRedirectByUser()
    const prevUrl = searchParams.get("prevUrl")
    if (prevUrl && type === "edit") {
      navigate(prevUrl)
      return
    }

    navigate(`/projects/${project.id}/plans/${testPlanId ?? ""}`)
  }

  const onSubmitEdit: SubmitHandler<ChangeTestPlanForm> = async (data) => {
    if (!stateTestPlan) return

    setErrors(null)
    const newTestCases = filterTestCases(objectToArrayOfString(data.test_cases))
    const { isSuccess, attributesJson, errors: attributeErrors } = makeAttributesJson(attributes)

    if (!isSuccess) {
      setErrors({ attributes: JSON.stringify(attributeErrors) })
      return
    }

    try {
      const newPlan = await updateTestPlan({
        id: stateTestPlan.id,
        body: {
          ...data,
          due_date: data.due_date.format("YYYY-MM-DD"),
          started_at: data.started_at.format("YYYY-MM-DD"),
          parent: data.parent ?? null,
          test_cases: newTestCases,
          attributes: attributesJson,
        },
      }).unwrap()
      antdNotification.success("edit-test-plan", {
        description: (
          <AlertSuccessChange
            id={String(newPlan.id)}
            action="updated"
            title={t("Test Plan")}
            link={`/projects/${project.id}/plans/${newPlan.id}`}
            data-testid="edit-test-plan-success-notification-description"
          />
        ),
      })
      clear()
      refetchParentAfterEdit(newPlan, stateTestPlan)
      redirectToPlan(stateTestPlan.id)
    } catch (err) {
      onHandleError(err)
    }
  }

  const onSubmitCreate: SubmitHandler<ChangeTestPlanForm> = async (data) => {
    setErrors(null)
    try {
      const newTestCases = filterTestCases(objectToArrayOfString(data.test_cases))
      const { isSuccess, attributesJson, errors: attributeErrors } = makeAttributesJson(attributes)
      if (!isSuccess) {
        setErrors({ attributes: JSON.stringify(attributeErrors) })
        return
      }

      const newTestPlan = await createTestPlan({
        ...data,
        test_cases: newTestCases,
        project: project.id,
        attributes: attributesJson,
        started_at: data.started_at.format("YYYY-MM-DD"),
        due_date: data.due_date.format("YYYY-MM-DD"),
      }).unwrap()
      antdNotification.success("create-test-plan", {
        description: (
          <AlertSuccessChange
            id={String(newTestPlan[0].id)}
            action="created"
            title={t("Test Plan")}
            link={`/projects/${project.id}/plans/${newTestPlan[0].id}`}
            data-testid="create-test-plan-success-notification-description"
          />
        ),
      })
      clear()
      refetchParentAfterCreate(newTestPlan[0])
      redirectToPlan(newTestPlan[0].id)
    } catch (err: unknown) {
      onHandleError(err)
    }
  }

  const handleSelectTestPlan = (value: SelectData | null) => {
    setErrors({ parent: "" })
    if (type === "edit" && Number(value?.value) === Number(stateTestPlan?.id)) {
      setErrors({ parent: t("Test Plan cannot be its own parent.") })
      return
    }

    setValue("parent", value ? value.value : null, { shouldDirty: true })
    setSelectedParent(value ? { value: value.value, label: value.label?.toString() ?? "" } : null)
  }

  useEffect(() => {
    if (parameters) {
      setParametersTreeView(makeParametersForTreeView(parameters))
    }
  }, [parameters])

  useEffect(() => {
    const parentId = searchParams.get("parent")
    if (!parentId || (parentId && stateTestPlan)) {
      return
    }

    const fetchParentPlan = async () => {
      const plan = await getTestPlan({
        project: project.id,
        testPlanId: parentId,
      }).unwrap()
      setStateTestPlan(plan)
      setValue("parent", plan.id)
      setSelectedParent({ value: plan.id, label: plan.name })
    }

    fetchParentPlan()
  }, [stateTestPlan, searchParams.get("parent")])

  useEffect(() => {
    if (!stateTestPlan || isLoadingAttributes) return

    if (type === "create") {
      reset({
        ...formDefaultVales,
        started_at: dayjs(stateTestPlan.started_at),
        due_date: dayjs(stateTestPlan.due_date),
      })
      setDateFrom(dayjs(stateTestPlan.started_at))
      setDateTo(dayjs(stateTestPlan.due_date))
      setSelectedParent({ value: stateTestPlan.id, label: stateTestPlan.name })
      setValue("parent", stateTestPlan.id, { shouldDirty: false })
    } else if (type === "edit" && tests) {
      const attachesWithUid = stateTestPlan?.attachments?.map((attach) => ({
        ...attach,
        uid: String(attach.id),
      }))
      if (attachesWithUid?.length) {
        setAttachments(attachesWithUid)
      }

      const attrs = getAttributeJson(stateTestPlan.attributes)
      setAttributes(attrs)

      reset({
        name: stateTestPlan.name,
        description: stateTestPlan.description,
        parent: stateTestPlan.parent?.id ?? null,
        test_cases: arrayOfStringToObject(tests.case_ids),
        started_at: dayjs(stateTestPlan.started_at),
        due_date: stateTestPlan.due_date ? dayjs(stateTestPlan.due_date) : undefined,
        attributes: attrs,
      })

      setDateFrom(dayjs(stateTestPlan.started_at))
      setDateTo(stateTestPlan.due_date ? dayjs(stateTestPlan.due_date) : dayjs())

      setSelectedParent(
        stateTestPlan.parent
          ? { value: stateTestPlan.parent.id, label: stateTestPlan.parent.name }
          : null
      )
    }
  }, [stateTestPlan, tests, type, isLoadingAttributes])

  useEffect(() => {
    setStateTestPlan(state?.testPlan ?? null)
  }, [state?.testPlan])

  return {
    errors,
    formErrors,
    tab,
    isDirty,
    isLoadingInitData: isLoadingGetTestPlan || isLoadingAttributes,
    isLoadingActionButton:
      isLoadingCreateTestPlan ||
      isLoadingUpdateTestPlan ||
      isLoadingAttachments ||
      isLoadingTestCases,
    control,
    selectedParent,
    attachments,
    attachmentsIds,
    parametersTreeView,
    stateTestPlan,
    setDateFrom,
    setDateTo,
    disabledDateTo,
    handleSelectTestPlan,
    setAttachments,
    handleAttachmentLoad,
    handleAttachmentRemove,
    handleAttachmentChange,
    setValue,
    handleTabChange,
    handleCancel,
    handleSubmitForm: handleSubmit(type === "create" ? onSubmitCreate : onSubmitEdit),
    register,
    attributes,
    addAttribute,
    onAttributeChangeName,
    onAttributeChangeType,
    onAttributeChangeValue,
    onAttributeRemove,
    watch,
  }
}
