import { ColumnDef } from "@tanstack/react-table"
import { Flex, Input, Popover, Tooltip, Typography } from "antd"
import classNames from "classnames"
import {
  DEFAULT_WITH_TREE,
  MAX_SMALLEST_SIZE,
  MAX_WITH_TREE_PERCENT,
  MIN_WITH_TREE,
  useTreebarProvider,
} from "processes/treebar-provider"
import { ChangeEvent, useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"

import { ChangeTestSuite } from "features/suite"
import { ChangeTestPlan } from "features/test-plan"

import { useProjectContext } from "pages/project/project-provider"

import CollapseIcon from "shared/assets/icons/arrows-in-simple.svg?react"
import BackIcon from "shared/assets/yi-icons/back-icon.svg?react"
import FilterIcon from "shared/assets/yi-icons/filter.svg?react"
import { useResizebleBlock } from "shared/hooks"
import { ArchivedTag, Button, ResizeLine } from "shared/ui"
import { DataTree, TreeNode } from "shared/ui/tree"

import styles from "./styles.module.css"
import { TreebarBreadcrumbs } from "./treebar-breadcrumbs"
import { TreebarFilter } from "./treebar-filter"
import { TreebarNodeView } from "./treebar-node-view"
import { saveUrlParamByKeys } from "./utils"

export const Treebar = () => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { testSuiteId, testPlanId } = useParams<ParamTestSuiteId & ParamTestPlanId>()
  const entityId = searchParams.get("parent")
    ? String(searchParams.get("parent"))
    : (testPlanId ?? testSuiteId)

  const {
    treebar,
    searchText,
    treeSettings,
    treebarWidth,
    initParent,
    selectedId,
    initDependencies,
    activeTab,
    updateTreeSettings,
    updateTreebarWidth,
    setSearchText,
    loadAncestors,
    loadChildren,
  } = useTreebarProvider()

  const TREE_TITLES = {
    suites: t("Test Suites & Cases"),
    plans: t("Test Plans & Results"),
  }

  const wrapperRef = useRef<HTMLDivElement>(null)
  const { width, handleMouseDown, setWidth } = useResizebleBlock({
    key: "treebar",
    elRef: wrapperRef,
    defaultWidth: treeSettings.collapsed ? MIN_WITH_TREE : DEFAULT_WITH_TREE,
    minWidth: MIN_WITH_TREE,
    maxWidth: MAX_WITH_TREE_PERCENT,
    maxAsPercent: true,
    updater: (newWidth: number) => {
      updateTreeSettings({ collapsed: newWidth < 200 })
      updateTreebarWidth(newWidth)
    },
  })

  const handleCollapsedTreeBar = () => {
    updateTreeSettings({ collapsed: !treeSettings.collapsed })
    const newWidth = !treeSettings.collapsed ? MIN_WITH_TREE : DEFAULT_WITH_TREE
    setWidth(newWidth)
    updateTreebarWidth(newWidth)
  }

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchText(value)
    if (value.length) {
      const urlParams = Object.fromEntries([...searchParams])
      setSearchParams({ ...urlParams, treeSearch: value })
    } else {
      searchParams.delete("treeSearch")
      setSearchParams(searchParams)
    }
  }

  const handleSelectNode = (nodeId: string) => {
    const urlParams = saveUrlParamByKeys(["rootId", "ordering", "is_archive"], searchParams)

    if (localStorage.getItem("isDrawerPinned") && searchParams.get("test_case")) {
      urlParams.append("test_case", searchParams.get("test_case") ?? "")
    }

    navigate({
      pathname: `/projects/${project.id}/${activeTab}/${nodeId}`,
      search: urlParams.toString(),
    })
  }

  const handleRootNode = (nodeId: string) => {
    const urlParams = { ...Object.fromEntries([...searchParams]), rootId: String(nodeId) }
    const queryParams = new URLSearchParams(urlParams)
    navigate({
      pathname: `/projects/${project.id}/${activeTab}/${nodeId}`,
      search: queryParams.toString(),
    })
  }

  const handleCloseAll = () => {
    treebar.current?.toggleAllRowsExpanded(false)
  }

  useEffect(() => {
    if (width !== treebarWidth) {
      updateTreebarWidth(width)
    }
  }, [width, treebarWidth])

  const IS_MINIFY = width < MAX_SMALLEST_SIZE || treeSettings.collapsed

  const columns: ColumnDef<TreeNode<Suite | TestPlan>>[] = useMemo(
    () => [
      {
        id: "name",
        cell: ({ row, table }) => (
          <TreebarNodeView
            tree={table}
            row={row}
            type={activeTab}
            projectId={project.id}
            searchText={searchText}
            onSelectRow={handleSelectNode}
            onRoot={handleRootNode}
          />
        ),
        meta: {
          fullWidth: true,
        },
      },
    ],
    [activeTab, project, searchText, handleSelectNode, handleRootNode]
  )

  return (
    <div
      className={classNames(styles.wrapper, { [styles.collapsed]: treeSettings.collapsed })}
      ref={wrapperRef}
      style={{ width: treeSettings.collapsed ? MIN_WITH_TREE : width }}
    >
      <div className={styles.container}>
        <div className={styles.topBlock}>
          <div className={styles.header}>
            <div
              className={classNames(styles.headerBlock, {
                [styles.headerBlockMin]: IS_MINIFY,
              })}
            >
              <Flex gap={8}>
                {project.is_archive && <ArchivedTag size="lg" />}
                <Typography.Title
                  level={1}
                  className={styles.headerTitle}
                  data-testid="treebar-header-title"
                >
                  {project.name}
                </Typography.Title>
              </Flex>
              <div className={styles.backBlock}>
                <button
                  className={styles.backBtn}
                  type="button"
                  onClick={handleCollapsedTreeBar}
                  data-testid="treebar-back-button"
                >
                  <BackIcon width={24} height={24} />
                </button>
              </div>
            </div>
            <span className={styles.activeTab}>{activeTab ? TREE_TITLES[activeTab] : ""}</span>
            {!IS_MINIFY && (
              <TreebarBreadcrumbs activeTab={activeTab} entityId={entityId} rootId={initParent} />
            )}
            <div
              className={classNames(styles.actionBlock, {
                [styles.actionBlockMin]: IS_MINIFY,
              })}
            >
              {activeTab === "suites" ? (
                <ChangeTestSuite
                  type="create"
                  size={IS_MINIFY ? "small" : "default"}
                  colorType="accent"
                />
              ) : (
                <ChangeTestPlan
                  type="create"
                  size={IS_MINIFY ? "small" : "default"}
                  colorType="accent"
                />
              )}
            </div>
          </div>
          <div className={styles.searchBlock}>
            <div className={styles.searchInputWrapper} data-testid="treebar-search-input-wrapper">
              <Input.Search
                placeholder={t("Search")}
                value={searchText}
                onChange={handleSearch}
                data-testid="treebar-search-input"
              />
            </div>
            {!IS_MINIFY && activeTab && (
              <Tooltip title={t("Filter & sort")}>
                <Popover
                  content={<TreebarFilter activeTab={activeTab} />}
                  arrow={false}
                  trigger="click"
                  placement="bottom"
                >
                  <Button
                    style={{ minWidth: 32 }}
                    icon={
                      <FilterIcon width={24} height={24} color="var(--y-color-secondary-inline)" />
                    }
                    data-testid="treebar-filter-button"
                    color="secondary-linear"
                    shape="square"
                  />
                </Popover>
              </Tooltip>
            )}
            <Tooltip title={t("Collapse All")}>
              <Button
                style={{ minWidth: 32 }}
                icon={
                  <CollapseIcon width={18} height={18} color="var(--y-color-secondary-inline)" />
                }
                onClick={handleCloseAll}
                data-testid="treebar-collapse-all-button"
                color="secondary-linear"
                shape="square"
              />
            </Tooltip>
          </div>
        </div>
        {activeTab && !treeSettings.collapsed && !treeSettings.collapsed && (
          <>
            <div className={styles.treeViewBlock} data-testid={`tree-view-${activeTab}`}>
              <DataTree
                treeRef={treebar}
                columns={columns}
                type="lazy"
                cacheExpandedKey={`${project.id}-treebar-${activeTab}`}
                state={{ rowActive: selectedId }}
                loadChildren={loadChildren}
                loadAncestors={loadAncestors}
                autoLoadRoot={{
                  deps: initDependencies,
                  additionalParams: {
                    parent: initParent,
                  },
                }}
                autoLoadParentsBySelected
                autoOpenParentsBySelected
                getRowCanExpand={(row) => row.original.props?.can_open ?? false}
                enableRowSelection
                showSelectionCheckboxes={false}
                enableMultiRowSelection={false}
                enableSubRowSelection={false}
                data-testid={`treebar-${activeTab}`}
              />
            </div>
          </>
        )}
      </div>
      {!IS_MINIFY && <ResizeLine onMouseDown={handleMouseDown} />}
    </div>
  )
}
