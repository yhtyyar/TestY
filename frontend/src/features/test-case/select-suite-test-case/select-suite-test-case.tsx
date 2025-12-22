import { ColumnDef, Row, RowSelectionState } from "@tanstack/react-table"
import { Input } from "antd"
import { ChangeEvent, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useLazyGetTestSuiteAncestorsQuery, useLazyGetTestSuitesQuery } from "entities/suite/api"

import { useProjectContext } from "pages/project"

import { config } from "shared/config"
import { useDebounce } from "shared/hooks"
import { Button } from "shared/ui"
import { NyModal } from "shared/ui/ny-modal/ny-modal"
import { DataTree, LazyTreeNodeParams, TreeNode } from "shared/ui/tree"
import { makeTreeNodes } from "shared/ui/tree/utils"

import styles from "./styles.module.css"
import { TreeNodeSuiteView } from "./tree-node-suite-view"

interface Props {
  suite: SelectData | null
  onChange: (suite: SelectData) => void
}

const TEST_ID = "select-suite"

export const SelectSuiteTestCase = ({ suite, onChange }: Props) => {
  const { t } = useTranslation()
  const project = useProjectContext()
  const [isSelectSuiteModalOpened, setIsSelectSuiteModalOpened] = useState(false)
  const [searchText, setSearchText] = useState("")
  const searchDebounce = useDebounce(searchText, 250, true)

  const [selectedSuiteRow, setSelectedSuiteRow] = useState<Row<TreeNode<Suite>> | null>(null)
  const [selectedSuite, setSelectedSuite] = useState<RowSelectionState>({})

  const [getSuites] = useLazyGetTestSuitesQuery()
  const [getAncestors] = useLazyGetTestSuiteAncestorsQuery()

  const columns: ColumnDef<TreeNode<Suite>>[] = useMemo(
    () => [
      {
        id: "name",
        cell: ({ row }) => <TreeNodeSuiteView row={row} onSelectRow={setSelectedSuiteRow} />,
      },
    ],
    []
  )

  const loadChildren = async (row: Row<TreeNode<Suite>> | null, params: LazyTreeNodeParams) => {
    const res = await getSuites(
      {
        project: project.id,
        page: params.page,
        parent: params.parent ? Number(params.parent) : null,
        page_size: config.defaultTreePageSize,
        ordering: "name",
        treesearch: searchDebounce,
        _n: new Date().getTime(),
      },
      true
    ).unwrap()

    const nodes = makeTreeNodes(
      res.results,
      {
        title: (result) => result.name,
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
    setSearchText(e.target.value)
  }

  const handleSelectApply = () => {
    if (selectedSuiteRow) {
      onChange({
        value: Number(selectedSuiteRow.original.id),
        label: selectedSuiteRow.original.data.name,
      })
      setIsSelectSuiteModalOpened(false)
    }
  }

  useEffect(() => {
    setSelectedSuite(suite ? { [suite.value.toString()]: true } : {})
  }, [suite])

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Input
          id="suite-edit-input"
          value={suite?.label?.toString()}
          readOnly
          style={{ width: "100%" }}
          onClick={() => setIsSelectSuiteModalOpened(true)}
        />
      </div>
      <NyModal
        bodyProps={{ "data-testid": `${TEST_ID}-modal-body` }}
        wrapProps={{ "data-testid": `${TEST_ID}-modal-wrapper` }}
        title={t("Select suite")}
        open={isSelectSuiteModalOpened}
        onCancel={() => setIsSelectSuiteModalOpened(false)}
        width="700px"
        className="select-suite-modal"
        footer={[
          <Button
            id="close-btn"
            key="back"
            onClick={() => setIsSelectSuiteModalOpened(false)}
            color="secondary-linear"
          >
            {t("Close")}
          </Button>,
          <Button id="select-suite" key="submit" color="accent" onClick={handleSelectApply}>
            {t("Select")}
          </Button>,
        ]}
      >
        <Input
          style={{ marginBottom: 8 }}
          placeholder={t("Search")}
          onChange={handleSearch}
          value={searchText}
          allowClear
        />
        <div className={styles.treeBlock}>
          <DataTree
            columns={columns}
            type="lazy"
            state={{ rowSelection: selectedSuite }}
            loadChildren={loadChildren}
            loadAncestors={loadAncestors}
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
            onRowSelectionChange={setSelectedSuite}
            styles={{
              cellInnerBody: (row) => ({
                padding: 0,
                backgroundColor: row.getIsSelected()
                  ? "var(--y-color-background-alternative)"
                  : "transparent",
              }),
            }}
            data-testid={`${TEST_ID}-tree`}
          />
        </div>
      </NyModal>
    </>
  )
}
