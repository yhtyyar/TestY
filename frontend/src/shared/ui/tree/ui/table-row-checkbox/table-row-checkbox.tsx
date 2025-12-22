import { Row } from "@tanstack/react-table"
import { Checkbox } from "antd"
import { useEffect } from "react"

import { useTreeProvider } from "../../tree-provider"
import { TreeNode } from "../../types/types"
import { createDataTestId } from "../../utils"
import { TableRowPlaceholder } from "../table-row-placeholder/table-row-placeholder"
import styles from "./styles.module.css"

const getSelectionState = <T extends TreeNode = TreeNode>(
  row: Row<T>
): { all: boolean; some: boolean } => {
  const isSelected = row.getIsSelected()
  const children = row.subRows || []

  if (children.length === 0) {
    return { all: isSelected, some: isSelected }
  }

  const results = children.map(getSelectionState)

  const allChildrenSelected = results.every((r) => r.all)
  const someChildrenSelected = results.some((r) => r.some)

  return {
    all: allChildrenSelected,
    some: isSelected || someChildrenSelected,
  }
}

interface Props<T> {
  row: Row<T>
}

export const TableRowCheckbox = <T extends TreeNode = TreeNode>({ row }: Props<T>) => {
  const { dataTestId, autoSelectParentIfAllSelected, onRowSelect } = useTreeProvider()

  const { all: allSubSelected, some: someSubSelected } = getSelectionState(row)
  const isChecked = !autoSelectParentIfAllSelected
    ? row.getIsSelected?.()
    : row.getIsSelected?.() || allSubSelected
  const isIndeterminate = !isChecked && someSubSelected

  const rowToggleSelected = (
    triggerRow: Row<T>,
    value?: boolean,
    opts?: {
      selectChildren?: boolean
    }
  ) => {
    triggerRow.toggleSelected(value, opts)
    if (onRowSelect) {
      onRowSelect(triggerRow)
    }
  }

  useEffect(() => {
    if (!autoSelectParentIfAllSelected) return

    if (row.getIsSelected?.() === false && allSubSelected) {
      rowToggleSelected(row, true, {
        selectChildren: false,
      })
    }

    if (row.getIsSelected?.() === true && !allSubSelected) {
      rowToggleSelected(row, false, {
        selectChildren: false,
      })
    }
  }, [row, isChecked, allSubSelected, someSubSelected, autoSelectParentIfAllSelected])

  const handleChange = () => {
    rowToggleSelected(row)
  }

  if (!row.getCanSelect()) {
    return <TableRowPlaceholder />
  }

  return (
    <div
      className={styles.checkboxWrapper}
      data-testid={createDataTestId(dataTestId, `checkbox-${row.original.title}`)}
    >
      <Checkbox
        checked={isChecked}
        indeterminate={isIndeterminate}
        onChange={handleChange}
        disabled={!row.getCanSelect()}
        className={styles.checkbox}
        data-testid={`${row.original.title}-checkbox-tree`}
      />
    </div>
  )
}
