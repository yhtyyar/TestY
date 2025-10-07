import { DownOutlined, LinkOutlined } from "@ant-design/icons"
import { Flex, Popover, Spin, Tooltip } from "antd"
import cn from "classnames"
import { useLazyGetIntegrationsQuery } from "entities/integrations/api"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useInView } from "react-intersection-observer"

import { useProjectContext } from "pages/project"

import { Button, Skeleton } from "shared/ui"

import { PLAN_PLACEHOLDER, PROJECT_PLACEHOLDER } from "../constants"
import styles from "./integrations-dropdown.module.css"

interface Props {
  testPlanId: number
  className?: string
}

const PAGE_SIZE = 10

export const IntegrationsDropdown = ({ testPlanId, className }: Props) => {
  const { t } = useTranslation()
  const project = useProjectContext()

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<IntegrationEntity[]>([])
  const [page, setPage] = useState(1)
  const [isLastPage, setIsLastPage] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [loadIntegrations] = useLazyGetIntegrationsQuery()

  const { ref, inView } = useInView()

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
  }

  useEffect(() => {
    let cancelled = false
    const loadFirst = async () => {
      setInitialLoading(true)
      try {
        const res = await loadIntegrations({
          project: project.id,
          page_type: "testplan",
          page: 1,
          page_size: PAGE_SIZE,
        }).unwrap()
        if (cancelled) {
          return
        }
        setItems(res.results)
        setIsLastPage(!res.pages.next)
        setPage(1)
      } finally {
        if (!cancelled) {
          setInitialLoading(false)
        }
      }
    }
    loadFirst()
    return () => {
      cancelled = true
    }
  }, [project.id])

  useEffect(() => {
    if (!open || !inView || isLastPage || isLoadingMore) {
      return
    }

    const fetchMore = async () => {
      setIsLoadingMore(true)
      const res = await loadIntegrations({
        project: project.id,
        page_type: "testplan",
        page: page + 1,
        page_size: PAGE_SIZE,
      }).unwrap()
      setItems((prev) => [...prev, ...res.results])
      setPage((p) => p + 1)
      setIsLastPage(!res.pages.next)
      setIsLoadingMore(false)
    }

    fetchMore()
  }, [inView, open])

  const resolveUrl = useMemo(() => {
    return (url: string) =>
      url
        .replace(PROJECT_PLACEHOLDER, String(project.id))
        .replace(PLAN_PLACEHOLDER, String(testPlanId))
  }, [project.id, testPlanId])

  if (initialLoading) {
    return <Skeleton width={100} height={32} className={cn(styles.skeleton, className)} />
  }

  if (items.length === 0) {
    return null
  }

  return (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      arrow={false}
      styles={{
        body: {
          padding: 0,
          width: 200,
        },
      }}
      placement="bottom"
      content={
        <div className={styles.content}>
          {items.map((it) => {
            const url = resolveUrl(it.service_url)
            return (
              <Tooltip
                key={it.id}
                placement="right"
                title={
                  <div>
                    {it.description && <div style={{ marginBottom: 6 }}>{it.description}</div>}
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{url}</div>
                  </div>
                }
              >
                <a
                  href={url}
                  target={it.is_new_tab ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  <LinkOutlined style={{ color: "var(--y-color-text-secondary)" }} />
                  <span style={{ flex: 1 }}>{it.name}</span>
                </a>
              </Tooltip>
            )
          })}
          {!isLastPage && !isLoadingMore && <div ref={ref} />}
          {!isLastPage && isLoadingMore && null}
          {isLoadingMore && (
            <Flex justify="center" align="center" className={styles.loading}>
              <Spin size="small" />
            </Flex>
          )}
        </div>
      }
    >
      <Button
        id="test-plan-integrations-dropdown"
        color="ghost"
        icon={<DownOutlined />}
        className={cn(styles.button, className)}
      >
        {t("Integrations")}
      </Button>
    </Popover>
  )
}
