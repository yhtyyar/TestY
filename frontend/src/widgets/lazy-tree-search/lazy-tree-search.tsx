import { ColumnDef, Row, RowSelectionState } from "@tanstack/react-table"
import Search from "antd/es/input/Search"
import { ChangeEvent, useEffect, useRef, useState } from "react"

import { LazyGetTriggerType } from "app/export-types"

import { useProjectContext } from "pages/project"

import { config } from "shared/config"
import { useDebounce, useOnClickOutside } from "shared/hooks"
import { BaseTreeNodeProps, DataTree, LazyTreeNodeParams, TreeNode } from "shared/ui/tree"
import { makeTreeNodes } from "shared/ui/tree/utils"

import { LazyTreeSearchNode } from "./lazy-tree-search-node"
import styles from "./styles.module.css"

export interface BaseSearchEntity {
  id: number
  name: string
  has_children: boolean
}

interface Props<T> {
  id: string
  getData: LazyGetTriggerType<PaginationResponse<T[]>>
  getAncestors: LazyGetTriggerType<number[]>
  onSelect: (data: TreeNode<T, BaseTreeNodeProps> | null) => void
  searchValue?: string
  selectedId?: number | null
  placeholder?: string
  valueKey?: string
  disabled?: boolean
  dataParams?: Record<string, unknown>
}

export const LazyTreeSearch = <T extends BaseSearchEntity>({
  id,
  getData,
  getAncestors,
  onSelect,
  selectedId,
  placeholder,
  valueKey = "name",
  disabled = false,
  searchValue = "",
  dataParams,
}: Props<T>) => {
  const project = useProjectContext()
  const [searchInputText, setSearchInputText] = useState(searchValue)
  const [searchText, setSearchText] = useState(searchValue)
  const [isShowDropdown, setIsShowDropdown] = useState(false)
  const searchDebounce = useDebounce(searchText, 250, true)
  const popupRef = useRef(null)
  const [selected, setSelected] = useState<RowSelectionState>({})

  const handleDropdownClickOutside = () => {
    setIsShowDropdown(false)
    setSearchText(selectedId ? searchValue : "")
    setSearchInputText(selectedId ? searchValue : "")
  }

  useOnClickOutside(popupRef, handleDropdownClickOutside, true, [`#${id}`])

  const loadChildren = async (row: Row<TreeNode<T>> | null, params: LazyTreeNodeParams) => {
    const res = await getData(
      {
        project: project.id,
        page: params.page,
        parent: params.parent ? Number(params.parent) : null,
        page_size: config.defaultTreePageSize,
        ordering: "name",
        treesearch: searchDebounce,
        _n: new Date().getTime(),
        ...dataParams,
      },
      true
    ).unwrap()

    const nodes = makeTreeNodes(
      res.results,
      {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        title: (item) => item?.[valueKey],
      },
      {
        parent: params.parent ?? null,
        page: params.page,
        _n: params._n?.toString(),
      }
    )

    return {
      data: nodes,
      params: {
        page: params.page,
        hasMore: !!res.pages.next,
      },
    }
  }

  const loadAncestors = async (rowId: string) => {
    return getAncestors({ project: project.id, id: Number(rowId) }).unwrap()
  }

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    setSearchText(value)
    setSearchInputText(value)
  }

  const handleSearchClick = () => {
    setIsShowDropdown(true)
  }

  const handleSelect = (node: Row<TreeNode<T>> | null) => {
    if (node) {
      setSearchInputText(node.original.title)
      onSelect(node.original)
      setIsShowDropdown(false)
    }
  }

  const handleClear = () => {
    setSearchInputText("")
    setSearchText("")
    onSelect(null)
  }

  useEffect(() => {
    setSearchInputText(searchValue)
  }, [searchValue])

  useEffect(() => {
    setSelected(selectedId ? { [selectedId.toString()]: true } : {})
  }, [selectedId])

  const columns: ColumnDef<TreeNode<T>>[] = [
    {
      id: "name",
      cell: ({ row }) => (
        <LazyTreeSearchNode node={row} onSelect={handleSelect} searchText={searchText} />
      ),
    },
  ]

  const handleSelectChange = (selectedRowKeys: RowSelectionState) => {
    setSelected(selectedRowKeys)
  }

  return (
    <div className={styles.searchContainer}>
      <Search
        id={id}
        style={{ marginBottom: 8 }}
        placeholder={placeholder}
        onChange={handleSearch}
        onClick={handleSearchClick}
        onClear={handleClear}
        value={searchInputText}
        allowClear
        disabled={disabled}
        autoComplete="off"
      />
      {isShowDropdown && !disabled && (
        <div className={styles.searchDropdown} ref={popupRef} data-testid={`${id}-search-dropdown`}>
          <DataTree
            columns={columns}
            type="lazy"
            loadChildren={loadChildren}
            loadAncestors={loadAncestors}
            state={{ rowActive: selected }}
            autoLoadRoot={{
              deps: [searchDebounce],
              additionalParams: {
                treesearch: searchDebounce,
              },
            }}
            autoLoadParentsBySelected
            autoOpenParentsBySelected
            getRowCanExpand={(row) => row.original.data.has_children}
            enableRowSelection
            showSelectionCheckboxes={false}
            enableMultiRowSelection={false}
            enableSubRowSelection={false}
            onRowSelectionChange={handleSelectChange}
            data-testid={`${id}-tree`}
          />
        </div>
      )}
    </div>
  )
}
