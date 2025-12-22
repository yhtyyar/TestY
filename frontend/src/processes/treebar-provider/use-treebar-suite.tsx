import { Row, Table } from "@tanstack/react-table"
import { useMemo, useRef } from "react"
import { useParams, useSearchParams } from "react-router-dom"

import { useLazyGetTestSuiteAncestorsQuery, useLazyGetTestSuitesQuery } from "entities/suite/api"

import { useProjectContext } from "pages/project"

import { config } from "shared/config"
import { useLazyAdvanced } from "shared/hooks"
import { LazyTreeNodeParams, TreeNode } from "shared/ui/tree"
import { makeTreeNodes } from "shared/ui/tree/utils"

import { TreeSettings } from "widgets/[ui]/treebar/utils"

interface Props {
  treeSettings: TreeSettings
  searchDebounce: string
}

export const useTreebarSuite = ({ treeSettings, searchDebounce }: Props) => {
  const project = useProjectContext()
  const { testSuiteId } = useParams<ParamTestSuiteId>()
  const [searchParams] = useSearchParams()

  const treebar = useRef<Table<TreeNode<Suite>>>(null)

  const [getSuites] = useLazyAdvanced(useLazyGetTestSuitesQuery)
  const [getAncestors] = useLazyAdvanced(useLazyGetTestSuiteAncestorsQuery)

  const loadChildren = async (row: Row<TreeNode<Suite>> | null, params: LazyTreeNodeParams) => {
    const res = await getSuites(
      {
        project: project.id,
        page: params.page,
        parent: params.parent ? Number(params.parent) : null,
        page_size: config.defaultTreePageSize,
        ordering: `${treeSettings.suites.sortBy === "desc" ? "-" : ""}${treeSettings.suites.filterBy}`,
        treesearch: searchDebounce,
        _n: params._n,
      },
      true
    ).unwrap()

    const nodes = makeTreeNodes(
      res.results,
      {
        title: (result) => result.name,
      },
      (result) => ({
        page: params.page,
        parent: params.parent,
        can_open: result.has_children,
        _n: params._n?.toString(),
      })
    )

    return {
      data: nodes,
      params: {
        page: params.page,
        hasMore: !!res.pages.next,
      },
    }
  }

  const initDependencies = useMemo(() => {
    return [searchParams.get("rootId"), searchDebounce, treeSettings.suites]
  }, [treeSettings.suites, searchDebounce, searchParams.get("rootId")])

  const loadAncestors = async (rowId: string) => {
    return getAncestors({ project: project.id, id: Number(rowId) }).unwrap()
  }

  return {
    treebar,
    loadChildren,
    loadAncestors,
    initDependencies,
    skipInit: false,
    selectedId: testSuiteId ?? null,
  }
}
