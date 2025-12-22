import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useGetProjectsQuery } from "entities/project/api"

import { useCopySuiteMutation } from "entities/suite/api"

import { useProjectContext } from "pages/project"

import { useAntdModals } from "shared/hooks"
import { isFetchBaseQueryError } from "shared/libs"
import { AlertSuccessChange } from "shared/ui"

interface FormSuiteCopy {
  new_name: string
  project: SelectData | null
  suite: SelectData | null
}

interface ErrorData {
  suites: {
    id: string[]
    new_name?: string[]
  }[]
}

export const useSuiteCopyModal = (
  mainSuite: Suite,
  onSubmit?: (newSuite: CopySuiteResponse) => void
) => {
  const { t } = useTranslation(["translation", "errors"])
  const { antdNotification, initInternalError } = useAntdModals()
  const [errors, setErrors] = useState<string[]>([])
  const [isShow, setIsShow] = useState(false)
  const project = useProjectContext()
  const [selectedSuite, setSelectedSuite] = useState<SelectData | null>(null)

  const [copySuite, { isLoading }] = useCopySuiteMutation()
  // TODO page_size 1000 = hack, need be scroll loading as search-field.tsx
  const { data: dataProjects, isLoading: isLoadingProjects } = useGetProjectsQuery(
    {
      page: 1,
      page_size: 1000,
    },
    { skip: !isShow }
  )

  const {
    handleSubmit,
    reset,
    control,
    formState: { isDirty, errors: formErrors },
    setValue,
    watch,
  } = useForm<FormSuiteCopy>()
  const watchProject = watch("project")

  const onHandleError = (err: unknown) => {
    if (isFetchBaseQueryError(err) && err?.status === 400) {
      const error = err.data as ErrorData
      const newNameErorrs = error.suites[0].new_name!
      setErrors(newNameErorrs)
    } else {
      initInternalError(err)
    }
  }

  const handleCancel = () => {
    reset({
      new_name: `${mainSuite.name}(Copy)`,
      project: { label: project.name, value: project.id },
      suite: null,
    })
    setSelectedSuite(null)
    setIsShow(false)
    setErrors([])
  }

  const handleShow = () => {
    setIsShow(true)
  }

  const handleChangeShow = (toggle: boolean) => {
    setIsShow(toggle)
  }

  const handleSave = async ({ new_name, project: projectData, suite }: FormSuiteCopy) => {
    if (!projectData) {
      setErrors([t("Project is required")])
      return
    }

    if (!new_name.trim().length) {
      setErrors([t("errors:newNameNotBeEmpty")])
      return
    }

    try {
      const newSuite = await copySuite({
        suites: [{ id: mainSuite.id.toString(), new_name }],
        dst_project_id: projectData.value.toString(),
        dst_suite_id: suite ? suite.value.toString() : undefined,
      }).unwrap()
      antdNotification.success("copy-suite", {
        description: (
          <AlertSuccessChange
            id={newSuite[0].id.toString()}
            link={`/projects/${newSuite[0].project}/suites/${newSuite[0].id}/`}
            action="copied"
            title={t("Suite")}
            data-testid="copy-suite-success-notification-description"
          />
        ),
      })
      handleCancel()
      onSubmit?.(newSuite[0])
    } catch (err) {
      onHandleError(err)
    }
  }

  const handleSelectSuite = (value?: SelectData | null) => {
    if (value) {
      setValue("suite", value, { shouldDirty: true })
      setSelectedSuite({ value: value.value, label: value.label })
    }
  }

  const handleSelectProject = (newProject: SelectData | null) => {
    setValue("project", newProject)
    setValue("suite", null)
    setSelectedSuite(null)
  }

  const projects = useMemo(() => {
    if (!dataProjects) return []

    return dataProjects.results
      .filter(({ is_visible }) => is_visible)
      .map((i) => ({
        label: i.name,
        value: i.id,
      }))
  }, [dataProjects])

  useEffect(() => {
    setValue("new_name", `${mainSuite.name}(Copy)`, { shouldDirty: true, shouldTouch: true })
    setValue(
      "project",
      { label: project.name, value: project.id },
      { shouldDirty: true, shouldTouch: true }
    )
  }, [mainSuite, project])

  return {
    errors,
    formErrors,
    isShow,
    isLoading,
    isDisabled: !isDirty || isLoading || isLoadingProjects,
    projects,
    control,
    selectedSuite,
    selectedProject: watchProject,
    handleCancel,
    handleChangeShow,
    handleShow,
    handleSelectSuite,
    handleSelectProject,
    handleSubmitForm: handleSubmit(handleSave),
  }
}
