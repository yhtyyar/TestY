import { useContext, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams, useSearchParams } from "react-router-dom"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useLazyGetTestCaseByIdQuery, useRestoreTestCaseMutation } from "entities/test-case/api"
import { selectDrawerTestCase, setDrawerTestCase } from "entities/test-case/model"

import { updateVersionEvent } from "shared/events/update-version-event"
import { initInternalError } from "shared/libs"
import { antdModalConfirm, antdNotification } from "shared/libs/antd-modals"
import { AlertSuccessChange } from "shared/ui"

import { TestCasesTreeContext } from "../test-cases-tree"

export const useTestCaseDetail = () => {
  const { t } = useTranslation()
  const { testSuiteId } = useParams<ParamTestSuiteId>()
  const { testCasesTree } = useContext(TestCasesTreeContext)!

  const dispatch = useAppDispatch()
  const drawerTestCase = useAppSelector(selectDrawerTestCase)
  const [searchParams, setSearchParams] = useSearchParams()
  const version = searchParams.get("ver") ?? searchParams.get("version")
  const testCaseId = searchParams.get("test_case")
  const [showVersion, setShowVersion] = useState<number | null>(null)
  const { control } = useForm()

  const [getTestCaseById, { isFetching }] = useLazyGetTestCaseByIdQuery()
  const [restoreTestCase] = useRestoreTestCaseMutation()

  const fetchTestCase = async ({ testCaseId: caseId, ver, nonce }: GetTestCaseByIdParams) => {
    try {
      const paramName = searchParams.has("version") ? "version" : "ver"
      const res = await getTestCaseById({
        testCaseId: caseId,
        [paramName]: ver,
        nonce,
      }).unwrap()
      dispatch(setDrawerTestCase(res))

      return res
    } catch (err: unknown) {
      initInternalError(err)
    }
  }

  useEffect(() => {
    if (!drawerTestCase) {
      return
    }
    setShowVersion(Number(drawerTestCase.current_version))
  }, [drawerTestCase])

  useEffect(() => {
    if (!testCaseId || drawerTestCase) {
      return
    }

    fetchTestCase({ testCaseId: String(testCaseId), ver: version ?? undefined })
  }, [testCaseId, drawerTestCase, version])

  useEffect(() => {
    return () => {
      dispatch(setDrawerTestCase(null))
    }
  }, [])

  useEffect(() => {
    const handleUpdateVersionParams = (data: { ver: string }) => {
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.delete("version")
      currentUrl.searchParams.set("ver", data.ver)
      setSearchParams(currentUrl.searchParams)
      window.history.replaceState(null, "", currentUrl.href)
    }

    updateVersionEvent.add(handleUpdateVersionParams)
    return () => {
      updateVersionEvent.remove(handleUpdateVersionParams)
    }
  }, [searchParams, setSearchParams])

  const versionData = useMemo(() => {
    if (!drawerTestCase?.versions) {
      return []
    }
    const sorted = [...drawerTestCase.versions].sort((a, b) => b - a)
    return sorted.map((item) => ({
      value: item,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      label: `${t("ver.")} ${item}`,
    }))
  }, [drawerTestCase, t])

  const handleClose = () => {
    searchParams.delete("test_case")
    searchParams.delete("ver")
    setSearchParams(searchParams)
    dispatch(setDrawerTestCase(null))
  }

  const handleChangeVersion = async (newVersion: number) => {
    setShowVersion(newVersion)
    searchParams.set("ver", String(newVersion))
    setSearchParams(searchParams)
    await fetchTestCase({
      testCaseId: String(testCaseId),
      ver: String(newVersion),
    })
  }

  const handleRestoreVersion = () => {
    if (!showVersion || !drawerTestCase) return

    antdModalConfirm("restore-test-case", {
      title: t("Do you want to restore this version of test case?"),
      okText: t("Restore"),
      onOk: async () => {
        try {
          const res = await restoreTestCase({
            testCaseId: drawerTestCase.id,
            version: showVersion,
          }).unwrap()
          setSearchParams({
            ver: String(res.versions[0]),
            test_case: String(drawerTestCase.id),
          })
          antdNotification.success("restore-test-case", {
            description: (
              <AlertSuccessChange
                id={String(drawerTestCase.id)}
                action="restore"
                title={t("Test Case")}
                link={`/projects/${drawerTestCase.project}/suites/${drawerTestCase.suite.id}?ver=${res.versions[0]}&test_case=${drawerTestCase.id}`}
                data-testid="restore-test-case-success-notification-description"
              />
            ),
          })
        } catch (err: unknown) {
          initInternalError(err)
        }
      },
    })
  }

  const handleRefetch = async (testCase: TestCase) => {
    if (!testCasesTree.current) {
      return
    }

    if (String(testSuiteId) === String(testCase.suite.id)) {
      await testCasesTree.current.initRoot()
      return
    }

    await testCasesTree.current?.refetchNodeBy((node) => node.id === testCase.suite.id)
  }

  const handleArchiveTestCase = async (testCase: TestCase) => {
    await handleRefetch(testCase)
    const newCase = await fetchTestCase({
      testCaseId: testCase.id.toString(),
      nonce: new Date().getTime(),
    })

    if (newCase) {
      setSearchParams((params) => {
        params.set("ver", newCase.current_version.toString())

        return params
      })
    }
  }

  return {
    testCase: drawerTestCase,
    showVersion,
    versionData,
    control,
    isFetching,
    handleClose,
    handleChangeVersion,
    handleRestoreVersion,
    handleArchiveTestCase,
    handleRefetch,
  }
}
