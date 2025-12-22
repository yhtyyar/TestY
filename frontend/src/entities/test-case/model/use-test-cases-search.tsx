import { ExpandedState } from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"

import { LabelFilterValue } from "entities/label/ui"

import { useLazySearchTestCasesQuery } from "entities/test-case/api"

import { useProjectContext } from "pages/project"

import { useDebounce, useLazyAdvanced } from "shared/hooks"
import { TreeUtils, isAbortError, makeTestSuitesWithCasesForTreeView } from "shared/libs"
import { BaseTreeNodeProps, TreeNode } from "shared/ui/tree"
import { arrayOfStringToObject, makeTreeNodes } from "shared/ui/tree/utils"

export const useTestCasesSearch = ({ isShow }: { isShow: boolean }) => {
  const project = useProjectContext()
  const [isLoading, setIsLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const debouncedSearch = useDebounce(searchText, 250)
  const [showArchived, setShowArchived] = useState(false)
  const [labelFilter, setLabelFilter] = useState<LabelFilterValue>({
    labels: [],
    not_labels: [],
    labels_condition: "and",
  })

  const [treeData, setTreeData] = useState<
    TreeNode<DataWithKey<SuiteWithCases>, BaseTreeNodeProps>[]
  >([])
  const [expandedRowKeys, setExpandedRowKeys] = useState<ExpandedState>({})

  const [searchTestCases] = useLazyAdvanced(useLazySearchTestCasesQuery)

  const fetchData = useCallback(
    async (params: SearchTestCasesQuery) => {
      try {
        const data = await searchTestCases(params).unwrap()
        return makeTestSuitesWithCasesForTreeView(data)
      } catch (err) {
        console.error(err)
        return []
      }
    },
    [searchTestCases]
  )

  const onSearch = useCallback(
    async (searchValue: string, searchLabels: LabelFilterValue, isArchive: boolean) => {
      try {
        setIsLoading(true)
        const suitesWithKeys = await fetchData({
          project: project.id.toString(),
          search: searchValue,
          labels: searchLabels.labels,
          not_labels: searchLabels.not_labels,
          labels_condition: searchLabels.labels_condition,
          is_archive: isArchive,
        })

        const [filteredRows, expandedRows] = TreeUtils.filterRows(suitesWithKeys, searchValue)
        if (
          searchValue.trim().length ||
          searchLabels.labels.length ||
          searchLabels.not_labels.length
        ) {
          setExpandedRowKeys(arrayOfStringToObject(expandedRows))
        } else {
          setExpandedRowKeys({})
        }

        const nodes = makeTreeNodes(filteredRows, {
          id: (item) => item.key,
          title: (item) => item.title,
          children: (item) => item?.children ?? [],
        })

        setTreeData(nodes)
        setIsLoading(false)
      } catch (err) {
        if (isAbortError(err)) {
          return
        }
        throw err
      }
    },
    []
  )

  const onClearSearch = () => {
    setSearchText("")
    setTreeData([])
    setExpandedRowKeys({})
  }

  const onToggleArchived = () => {
    setShowArchived(!showArchived)
  }

  const onChangeLabelFilter = (value: LabelFilterValue) => {
    setLabelFilter(value)
  }

  const onChangeLabelFilterCondition = (condition: LabelCondition) => {
    setLabelFilter((prevState) => ({
      ...prevState,
      labels_condition: condition,
    }))
  }

  const memoSearchParams = useMemo(() => {
    return {
      search: debouncedSearch,
      labelFilter,
      showArchived,
    }
  }, [debouncedSearch, labelFilter, showArchived])
  const debouncedSearchParams = useDebounce(memoSearchParams, 250)

  useEffect(() => {
    if (!isShow) return

    onSearch(
      debouncedSearchParams.search,
      debouncedSearchParams.labelFilter,
      debouncedSearchParams.showArchived
    )
  }, [debouncedSearchParams, isShow])

  return {
    searchText,
    treeData,
    expandedRowKeys,
    isLoading,
    setSearchText,
    onRowExpand: setExpandedRowKeys,
    onClearSearch,
    showArchived,
    onToggleArchived,
    labelFilter,
    onChangeLabelFilter,
    onChangeLabelFilterCondition,
  }
}
