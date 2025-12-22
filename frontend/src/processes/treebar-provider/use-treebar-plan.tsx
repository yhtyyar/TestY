import { Row, Table } from "@tanstack/react-table"
import { useMemo, useRef } from "react"
import { useParams, useSearchParams } from "react-router-dom"

import { useLazyGetTestPlanAncestorsQuery, useLazyGetTestPlansQuery } from "entities/test-plan/api"

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

export const useTreebarPlan = ({ treeSettings, searchDebounce }: Props) => {
  const project = useProjectContext()
  const { testPlanId } = useParams<ParamTestPlanId>()
  const [searchParams] = useSearchParams()

  const treebar = useRef<Table<TreeNode<TestPlan>>>(null)

  const [getPlans] = useLazyAdvanced(useLazyGetTestPlansQuery)
  const [getAncestors] = useLazyAdvanced(useLazyGetTestPlanAncestorsQuery)

  const loadChildren = async (row: Row<TreeNode<TestPlan>> | null, params: LazyTreeNodeParams) => {
    const res = await getPlans(
      {
        project: project.id,
        page: params.page,
        parent: params.parent ? Number(params.parent) : null,
        page_size: config.defaultTreePageSize,
        ordering: `${treeSettings.plans.sortBy === "desc" ? "-" : ""}${treeSettings.plans.filterBy}`,
        treesearch: searchDebounce,
        is_archive: treeSettings.show_archived,
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
    return [
      searchParams.get("rootId"),
      searchDebounce,
      treeSettings.show_archived,
      treeSettings.plans,
    ]
  }, [treeSettings.show_archived, treeSettings.plans, searchDebounce, searchParams.get("rootId")])

  const loadAncestors = async (rowId: string) => {
    return getAncestors({ project: project.id, id: Number(rowId) }).unwrap()
  }

  return {
    treebar,
    loadChildren,
    loadAncestors,
    initDependencies,
    skipInit: false,
    selectedId: testPlanId ?? null,
  }
}
