import { useMeContext } from "processes"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { useInView } from "react-intersection-observer"

import { useLazyGetProjectsQuery } from "entities/project/api"

import { DashboardViewContext } from "../../dashboard"

interface RequestParams {
  page: number
  page_size: number
  is_archive?: boolean
  favorites?: boolean
  name?: string
  nonce?: number
}

interface Props {
  searchName: string
}

export const useProjectsDashboardCards = ({ searchName }: Props) => {
  const { userConfig } = useMeContext()
  const [paginationParams, setPaginationParams] = useState({ page: 1, page_size: 10 })
  const [projects, setProjects] = useState<Project[]>([])
  const [isLastPage, setIsLastPage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [nonce, setNonce] = useState(1)
  const dashboardContext = useContext(DashboardViewContext)

  const [getProjects] = useLazyGetProjectsQuery()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const activeRequestRef = useRef<any>(null)
  const isInitialLoadRef = useRef(true)

  const { ref, inView } = useInView({
    threshold: 0.5,
    trackVisibility: true,
    delay: 150,
    skip: isLoading || isLastPage,
  })

  const fetchData = useCallback(
    async (params: RequestParams, isSearch = false) => {
      if (activeRequestRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        activeRequestRef.current.abort()
      }

      try {
        setIsLoading(true)
        const res = getProjects({ ...params, ordering: "is_private" })
        activeRequestRef.current = res

        const { data } = await res

        if (!data) {
          setIsLastPage(true)
          return
        }

        const hasResults = data.results && data.results.length > 0
        const isLast = !data.pages?.next || !hasResults

        setProjects((prevState) => {
          if (isSearch) {
            return data.results || []
          }
          return hasResults ? [...prevState, ...data.results] : prevState
        })

        setIsLastPage(isLast)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
        activeRequestRef.current = null
      }
    },
    [getProjects]
  )

  const handleClear = useCallback(() => {
    setPaginationParams({ page: 1, page_size: paginationParams.page_size })
    setProjects([])
    setIsLastPage(false)
  }, [paginationParams.page_size])

  useEffect(() => {
    if (!inView || isLoading || isLastPage || isInitialLoadRef.current) return

    const nextPage = paginationParams.page + 1

    setPaginationParams((prev) => ({
      ...prev,
      page: nextPage,
    }))

    fetchData({
      page: nextPage,
      page_size: paginationParams.page_size,
      is_archive: userConfig?.projects?.is_show_archived,
      favorites: userConfig?.projects?.is_only_favorite ?? false,
      name: searchName,
    })
  }, [
    inView,
    isLoading,
    isLastPage,
    paginationParams.page,
    paginationParams.page_size,
    userConfig?.projects?.is_show_archived,
    userConfig?.projects?.is_only_favorite,
    searchName,
    fetchData,
  ])

  useEffect(() => {
    handleClear()
    isInitialLoadRef.current = true

    fetchData({
      page: 1,
      page_size: paginationParams.page_size,
      is_archive: userConfig?.projects?.is_show_archived,
      favorites: userConfig?.projects?.is_only_favorite ?? false,
      name: searchName,
    }).finally(() => {
      isInitialLoadRef.current = false
    })
  }, [
    userConfig?.projects?.is_only_favorite,
    userConfig?.projects?.is_show_archived,
    fetchData,
    handleClear,
    paginationParams.page_size,
  ])

  useEffect(() => {
    if (isInitialLoadRef.current) return

    handleClear()

    fetchData(
      {
        page: 1,
        page_size: paginationParams.page_size,
        is_archive: userConfig?.projects?.is_show_archived,
        favorites: userConfig?.projects?.is_only_favorite ?? false,
        name: searchName,
      },
      true
    )
  }, [
    searchName,
    fetchData,
    handleClear,
    paginationParams.page_size,
    userConfig?.projects?.is_show_archived,
    userConfig?.projects?.is_only_favorite,
  ])

  useEffect(() => {
    return () => {
      if (activeRequestRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        activeRequestRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    if (!dashboardContext?.needRefetchProjects) {
      return
    }

    const refreshPages = async () => {
      const newProjects: Project[] = []

      for (let i = 1; i <= paginationParams.page; i++) {
        const data = await getProjects({
          page: i,
          page_size: paginationParams.page_size,
          is_archive: userConfig?.projects?.is_show_archived,
          favorites: userConfig?.projects?.is_only_favorite ?? false,
          name: searchName,
          nonce: nonce,
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
    paginationParams.page,
    searchName,
    nonce,
    userConfig?.projects?.is_show_archived,
    userConfig?.projects?.is_only_favorite,
  ])

  return {
    projects,
    isLoading,
    isLastPage,
    bottomRef: ref,
  }
}
