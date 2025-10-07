import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "react-router"

import { useLazySearchTestCasesQuery } from "entities/test-case/api"

import { TreeUtils, makeTestSuitesWithCasesForTreeView } from "shared/libs"

export const useTestCasesSearch = ({ isShow }: { isShow: boolean }) => {
  const { projectId } = useParams<ParamProjectId>()
  const [searchText, setSearchText] = useState("")
  const [treeData, setTreeData] = useState<DataWithKey<Suite>[]>([])
  const [searchTestCases, { isFetching: isLoading }] = useLazySearchTestCasesQuery()
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeRequestRef = useRef<any>(null)

  const fetchData = useCallback(
    async (params: SearchTestCasesQuery) => {
      if (activeRequestRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        activeRequestRef.current.abort()
      }

      try {
        const res = searchTestCases(params)
        activeRequestRef.current = res

        const { data = [] } = await res
        return makeTestSuitesWithCasesForTreeView(data)
      } catch (err) {
        console.error(err)
        return []
      } finally {
        activeRequestRef.current = null
      }
    },
    [projectId, searchTestCases]
  )

  useEffect(() => {
    if (!isShow || !projectId) return
    const fetch = async () => {
      const suitesWithKeys = await fetchData({ project: projectId })
      setTreeData(suitesWithKeys as unknown as DataWithKey<Suite>[])
    }

    fetch()
  }, [isShow, projectId])

  const onSearch = async (
    value: string,
    labels: number[],
    labels_condition: LabelCondition,
    showArchived = false
  ) => {
    if (!projectId || !isShow) return
    if (value !== searchText) {
      setSearchText(value)
    }

    const suitesWithKeys = await fetchData({
      project: projectId,
      search: value,
      labels,
      labels_condition: labels.length > 1 ? labels_condition : undefined,
      is_archive: showArchived,
    })

    const [filteredRows] = TreeUtils.filterRows(
      suitesWithKeys as unknown as DataWithKey<Suite>[],
      value,
      {
        isAllExpand: true,
        isShowChildren: true,
      }
    )

    if (!value.trim().length && !labels.length) {
      setExpandedRowKeys([])
    }
    setTreeData(filteredRows)
  }

  const onRowExpand = (expandedRows: string[], recordKey: string) => {
    if (expandedRows.includes(recordKey)) {
      setExpandedRowKeys(expandedRows.filter((key) => key !== recordKey))
    } else {
      setExpandedRowKeys([...expandedRows, recordKey])
    }
  }

  const onClearSearch = () => {
    setSearchText("")
    setTreeData([])
    setExpandedRowKeys([])
  }

  return {
    searchText,
    treeData,
    expandedRowKeys,
    isLoading,
    onSearch,
    onRowExpand,
    onClearSearch,
  }
}
