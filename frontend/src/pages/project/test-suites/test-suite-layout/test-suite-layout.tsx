import { FetchBaseQueryError, QueryActionCreatorResult } from "@reduxjs/toolkit/query"
import { QueryDefinition } from "@reduxjs/toolkit/query"
import { BaseQueryFn } from "@reduxjs/toolkit/query"
import { FetchArgs } from "@reduxjs/toolkit/query"
import { Tabs, TabsProps } from "antd"
import React, { useContext, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import { TestSuiteHeader } from "widgets"
import { FooterView } from "widgets"

import { useAppDispatch, useAppSelector } from "app/hooks"

import { useGetSuiteQuery } from "entities/suite/api"

import { selectDataView, setDataView } from "entities/test-case/model"

import { TestCasesTreeProvider } from "widgets/test-case"

import { useProjectContext } from "../../project-provider"
import styles from "./styles.module.css"

export interface TestSuiteContextType {
  suite?: Suite
  isFetching: boolean
  refetch: () => QueryActionCreatorResult<
    QueryDefinition<
      GetTestSuiteQuery,
      BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      Suite,
      "suiteApi"
    >
  >
  hasTestSuite: boolean
  dataView: EntityView
  updateDataView: (view: EntityView) => void
}

export const TestSuiteContext = React.createContext<TestSuiteContextType | null>(null)

type TestSuiteTabs = "overview" | "custom-attributes" | "attachments"
const tabKeys = ["overview", "custom-attributes", "attachments"]

export const TestSuiteLayout = () => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const { testSuiteId } = useParams<ParamTestSuiteId>()
  const navigate = useNavigate()
  const location = useLocation()
  const dataView = useAppSelector(selectDataView)
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState<TestSuiteTabs>("overview")

  const {
    data: suite,
    isFetching,
    refetch,
  } = useGetSuiteQuery(
    {
      suiteId: testSuiteId ?? "",
    },
    {
      skip: !testSuiteId,
    }
  )

  useEffect(() => {
    const pathSegments = location.pathname.split("/")
    const lastSegment = pathSegments[pathSegments.length - 1]

    setTab(tabKeys.includes(lastSegment) ? (lastSegment as TestSuiteTabs) : "overview")
  }, [location.pathname])

  const handleTabChange = (newTab: string) => {
    setTab(newTab as TestSuiteTabs)
    if (newTab === "overview") {
      navigate(`/projects/${project.id}/suites/${testSuiteId}`)
      return
    }

    navigate(`/projects/${project.id}/suites/${testSuiteId}/${newTab}`)
  }

  const updateDataView = (view: EntityView) => {
    dispatch(setDataView(view))
  }

  const tabItems: TabsProps["items"] = [
    {
      key: "overview",
      label: t("Overview"),
    },
    {
      key: "custom-attributes",
      label: t("Custom Attributes"),
    },
    {
      key: "attachments",
      label: t("Attachments"),
    },
  ]

  const value = useMemo(
    () => ({
      suite,
      isFetching,
      refetch,
      hasTestSuite: !!testSuiteId && !!suite,
      dataView,
      updateDataView,
    }),
    [suite, isFetching, refetch, testSuiteId, dataView, updateDataView]
  )

  return (
    <TestSuiteContext.Provider value={value}>
      <TestCasesTreeProvider>
        <div className={styles.wrapper}>
          <TestSuiteHeader />
          {testSuiteId && (
            <Tabs
              defaultActiveKey="overview"
              activeKey={tab}
              items={tabItems}
              onChange={handleTabChange}
              style={{ marginBottom: 24 }}
            />
          )}
          <Outlet />
        </div>
        <FooterView />
      </TestCasesTreeProvider>
    </TestSuiteContext.Provider>
  )
}

export const useTestSuiteContext = () => {
  return useContext(TestSuiteContext)!
}
