import { useMeContext } from "processes"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { useInView } from "react-intersection-observer"

import { useLazyGetProjectsQuery } from "entities/project/api"

import { useLazyAdvanced } from "shared/hooks"
import { usePagination } from "shared/ui"

import { DashboardViewContext } from "../../dashboard"

interface RequestMeta {
  is_search: boolean
}

interface Props {
  searchName: string
}

export const useProjectsDashboardCards = ({ searchName }: Props) => {
  const { userConfig } = useMeContext()
  const { pagination, setPagination, resetPagination } = usePagination()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLastPage, setIsLastPage] = useState(false)
  const [nonce, setNonce] = useState(1)
  const dashboardContext = useContext(DashboardViewContext)

  const [getProjects, { isFetching }] = useLazyAdvanced<
    QueryWithPagination<GetProjectsQuery>,
    PaginationResponse<Project[]>,
    RequestMeta
  >(useLazyGetProjectsQuery, {
    onSuccess: (_, { results, pages }, meta) => {
      const hasResults = results.length > 0
      const isLast = !pages.next || !hasResults
      setIsLastPage(isLast)

      setProjects((prevState) => {
        if (meta?.is_search) {
          return results
        }
        return hasResults ? [...prevState, ...results] : prevState
      })
    },
  })

  const isInitialLoadRef = useRef(true)

  const { ref, inView } = useInView({
    threshold: 0.5,
    trackVisibility: true,
    delay: 150,
    skip: isFetching || isLastPage,
  })

  const handleClear = useCallback(() => {
    resetPagination({ pageSize: pagination.pageSize })
    setProjects([])
    setIsLastPage(false)
  }, [pagination.pageSize])

  useEffect(() => {
    if (!inView || isFetching || isLastPage || isInitialLoadRef.current) return

    setPagination((prev) => {
      const nextPage = prev.pageIndex + 1
      getProjects({
        page: nextPage + 1,
        page_size: prev.pageSize,
        is_archive: userConfig?.projects?.is_show_archived,
        favorites: userConfig?.projects?.is_only_favorite ?? false,
        name: searchName,
        ordering: "is_private",
      })

      return {
        ...prev,
        pageIndex: nextPage,
      }
    })
  }, [
    inView,
    isFetching,
    isLastPage,
    pagination.pageIndex,
    pagination.pageSize,
    userConfig?.projects?.is_show_archived,
    userConfig?.projects?.is_only_favorite,
    searchName,
  ])

  useEffect(() => {
    handleClear()
    isInitialLoadRef.current = true

    getProjects({
      page: 1,
      page_size: pagination.pageSize,
      is_archive: userConfig?.projects?.is_show_archived,
      favorites: userConfig?.projects?.is_only_favorite ?? false,
      name: searchName,
      ordering: "is_private",
    }).finally(() => {
      isInitialLoadRef.current = false
    })
  }, [
    userConfig?.projects?.is_only_favorite,
    userConfig?.projects?.is_show_archived,
    handleClear,
    pagination.pageSize,
  ])

  useEffect(() => {
    if (isInitialLoadRef.current) return

    handleClear()

    getProjects(
      {
        page: 1,
        page_size: pagination.pageSize,
        is_archive: userConfig?.projects?.is_show_archived,
        favorites: userConfig?.projects?.is_only_favorite ?? false,
        name: searchName,
        ordering: "is_private",
      },
      {
        is_search: true,
      }
    )
  }, [
    searchName,
    handleClear,
    pagination.pageSize,
    userConfig?.projects?.is_show_archived,
    userConfig?.projects?.is_only_favorite,
  ])

  useEffect(() => {
    if (!dashboardContext?.needRefetchProjects) {
      return
    }

    const refreshPages = async () => {
      const newProjects: Project[] = []

      for (let i = 1; i <= pagination.pageIndex + 1; i++) {
        const data = await getProjects({
          page: i,
          page_size: pagination.pageSize,
          is_archive: userConfig?.projects?.is_show_archived,
          favorites: userConfig?.projects?.is_only_favorite ?? false,
          name: searchName,
          nonce,
          ordering: "is_private",
        }).unwrap()

        newProjects.push(...data.results)
      }

      setProjects(newProjects)
    }

    refreshPages()

    dashboardContext.setNeedRefetchProjects(false)
    setNonce((prev) => prev + 1)
  }, [
    dashboardContext?.needRefetchProjects,
    pagination.pageIndex,
    searchName,
    nonce,
    userConfig?.projects?.is_show_archived,
    userConfig?.projects?.is_only_favorite,
  ])

  return {
    projects,
    isLoading: isFetching,
    isLastPage,
    bottomRef: ref,
  }
}
