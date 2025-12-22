import { CaretRightOutlined, SearchOutlined } from "@ant-design/icons"
import { ColumnDef, ExpandedState, RowSelectionState } from "@tanstack/react-table"
import { Flex, Input, Select, TreeDataNode } from "antd"
import classNames from "classnames"
import React, { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useDebounce } from "shared/hooks"
import { objectToArrayNumber } from "shared/libs"
import { Button, HighLighterTesty, Toggle } from "shared/ui"

import { DataTree, TreeNode } from "../tree"
import { arrayOfStringToObject, makeTreeNodes } from "../tree/utils"
import styles from "./styles.module.css"
import { BaseTreeFilterNode, FilterWithKey, treeFilterFormat } from "./utils"

interface TreeDataNodeExtend extends TreeDataNode {
  key: string
  titleText: string
  children: TreeDataNodeExtend[]
}

interface Props<T> {
  type: "suites" | "plans"
  getData: () => Promise<T[]>
  getDataFromRoot: () => Promise<T[]>
  value: number[]
  onChange: (keys: number[]) => void
  onClose?: () => void
  onClear?: () => void
  showFullOnly?: boolean
  treeWrapperId: string
  enableSubRowSelection?: boolean
}

function findNodesWithParentKeys(
  tree: TreeNode<TreeDataNodeExtend>[],
  title: string,
  parentKey: string | null = null,
  path: string[] = []
): string[] {
  let results: string[] = []

  for (const node of tree) {
    const currentPath = [...path, parentKey].filter(Boolean) as string[]

    if (String(node.data.titleText.toLowerCase()).includes(title.toLowerCase())) {
      results.push(...currentPath)
    }

    if (node.children && node.children.length > 0) {
      results = results.concat(
        findNodesWithParentKeys(node.children, title, node.data.key, currentPath)
      )
    }
  }

  return Array.from(new Set(results))
}

function findTreeNodeById<T extends BaseTreeFilterNode>(
  tree: T[],
  id: number
): BaseTreeFilterNode | null {
  for (const node of tree) {
    if (Number(node.id) === id) {
      return node
    }
    if (node.children) {
      const found = findTreeNodeById(node.children, id)
      if (found) {
        return found
      }
    }
  }
  return null
}

export const EntityTreeFilter = <T extends BaseTreeFilterNode>({
  treeWrapperId,
  type,
  value,
  getData,
  getDataFromRoot,
  onChange,
  onClose,
  onClear,
  showFullOnly = false,
  enableSubRowSelection = true,
}: Props<T>) => {
  const { t } = useTranslation()

  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isShowFullTree, setIsShowFullTree] = useState(showFullOnly)
  const [expandedKeys, setExpandedKeys] = useState<ExpandedState>({})
  const [searchValue, setSearchValue] = useState("")
  const searchDebounce = useDebounce(searchValue, 250, true)
  const [allEntityData, setAllEntityData] = useState<T[]>([])
  const [visibleShortData, setVisibleShortData] = useState<T[]>([])

  const visibleData = isShowFullTree ? allEntityData : visibleShortData

  const treeData = useMemo(() => {
    if (!visibleData.length) {
      return { data: [], selectedData: [] }
    }

    const [data, selectedData] = treeFilterFormat<T>({
      data: visibleData,
      searchValue: searchDebounce,
      titleKey: type === "plans" ? "title" : "name",
    })

    const dataTree = makeTreeNodes(data, {
      title: (row) => row.titleText,
      parent: (row) => row.parent?.id.toString() ?? null,
      children: (row) => row.children,
    })

    return {
      data: dataTree,
      selectedData,
    }
  }, [visibleData, searchDebounce])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value: newValue } = e.target

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const newExpandedKeys = findNodesWithParentKeys(treeData.data, newValue)
    setExpandedKeys(arrayOfStringToObject(newExpandedKeys))
    setSearchValue(newValue)
  }

  const handleSelectAll = () => {
    onChange(treeData.selectedData)
  }

  const handleDropdownVisibleChange = (toggle: boolean) => {
    setIsOpen(toggle)
    if (!toggle) {
      setSearchValue("")
      onClose?.()
    }
  }

  const handleChange = (
    dataValue: {
      value: string
      label: string | undefined
    }[]
  ) => {
    const keys = dataValue.map((i) => Number(i.value))
    if (!keys.length) {
      onClear?.()
      return
    }

    onChange(keys)
  }

  const handleCheck = (checkedKeysValue: RowSelectionState) => {
    onChange(objectToArrayNumber(checkedKeysValue))
  }

  const handleShowFullTree = (toggle: boolean) => {
    setIsShowFullTree(toggle)
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const allData = await getDataFromRoot()
      const shortData = await getData()
      setAllEntityData(allData)
      setVisibleShortData(shortData)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  const checkedKeys = useMemo(() => {
    return arrayOfStringToObject(value)
  }, [value])

  const columns: ColumnDef<TreeNode<FilterWithKey>>[] = useMemo(
    () => [
      {
        id: "name",
        cell: ({ row }) => (
          <div className={styles.treeRow} onClick={() => row.toggleSelected()}>
            <HighLighterTesty searchWords={searchValue} textToHighlight={row.original.title} />
          </div>
        ),
        meta: {
          fullWidth: true,
        },
      } as ColumnDef<TreeNode<FilterWithKey>>,
    ],
    [searchValue]
  )

  const checkedKeysWithLabel = useMemo(() => {
    return value.map((val) => {
      const node = findTreeNodeById(allEntityData, val)
      return {
        value: String(val),
        label: node ? (type === "plans" ? node.title : node.name) : String(val),
      }
    })
  }, [value, allEntityData, type])

  const PLACEHOLDER_SELECT =
    type === "plans" ? t("Filter by Test Plans") : t("Filter by Test Suites")

  return (
    <Select
      id={`${type}-tree-filter`}
      value={isLoading ? [] : checkedKeysWithLabel}
      labelInValue
      mode="multiple"
      maxTagCount={6}
      showSearch={false}
      placeholder={PLACEHOLDER_SELECT}
      defaultActiveFirstOption={false}
      filterOption={false}
      open={isOpen}
      loading={isLoading}
      onClear={onClear}
      onChange={handleChange}
      allowClear
      style={{ width: "100%" }}
      styles={{ popup: { root: { padding: 0 } } }}
      onOpenChange={handleDropdownVisibleChange}
      popupRender={() => (
        <div data-testid={treeWrapperId}>
          <div className={styles.searchBlock} data-testid="entity-tree-filter-search-block">
            <Input
              className={styles.input}
              placeholder={t("Search")}
              variant="borderless"
              value={searchValue}
              autoFocus
              onChange={handleSearch}
              suffix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
            />
          </div>
          <div style={{ padding: "8px 16px" }}>
            <Flex align="center" justify="space-between" style={{ marginBottom: 8 }}>
              <Flex gap={8}>
                <Button
                  size="s"
                  onClick={handleSelectAll}
                  style={{ padding: "4px 8px" }}
                  color="secondary-linear"
                  data-testid="entity-tree-filter-select-all"
                >
                  {t("Select all")}
                </Button>
                <Button
                  onClick={onClear}
                  size="s"
                  style={{ padding: "4px 8px" }}
                  color="secondary-linear"
                  data-testid="entity-tree-filter-reset"
                >
                  {t("Reset")}
                </Button>
              </Flex>
              {!showFullOnly && (
                <Toggle
                  id={`${type}-toggle-show-full-tree`}
                  label={t("Show full tree")}
                  labelFontSize={14}
                  checked={isShowFullTree}
                  onChange={handleShowFullTree}
                  size="sm"
                />
              )}
            </Flex>
            <DataTree
              data={treeData.data}
              columns={columns}
              isLoading={isLoading}
              enableRowSelection
              enableSubRowSelection={enableSubRowSelection}
              state={{
                rowSelection: checkedKeys,
                expanded: expandedKeys,
              }}
              onRowSelectionChange={handleCheck}
              onExpandedChange={setExpandedKeys}
              styles={{ container: { height: 300 } }}
              expandIcon={(row) => (
                <CaretRightOutlined
                  data-testid={
                    `node-arrow-${row.original.title}` +
                    (row.getIsExpanded() ? "_expanded" : "_closed")
                  }
                  className={classNames(styles.arrow, {
                    [styles.expanded]: row.getIsExpanded(),
                  })}
                />
              )}
              data-testid="entity-tree-filter-tree"
            />
            <span
              style={{ opacity: 0.7, marginTop: 4 }}
              data-testid="entity-tree-filter-selected-count"
            >
              {t("Selected")}: {value.length}
            </span>
          </div>
        </div>
      )}
    />
  )
}
