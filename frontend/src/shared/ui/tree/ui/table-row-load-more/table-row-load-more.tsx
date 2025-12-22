import { Row } from "@tanstack/react-table"
import { Spin } from "antd"
import classNames from "classnames"
import { useTranslation } from "react-i18next"

import { useTreeProvider } from "../../tree-provider"
import { createDataTestId } from "../../utils"
import { TableRowPlaceholder } from "../table-row-placeholder/table-row-placeholder"
import styles from "./styles.module.css"

interface Props<T> {
  row?: Row<T>
}

// eslint-disable-next-line comma-spacing
export const TableRowLoadMore = <T,>({ row }: Props<T>) => {
  const { t } = useTranslation()
  const { tree, dataTestId, color } = useTreeProvider()
  const entity = row ? row : tree
  const depth = row ? row.depth + 1 : 0
  const index = row ? row.index : 0

  if (!entity.getCanLoadMore()) {
    return null
  }

  return (
    <tr data-testid={createDataTestId(dataTestId, `loadmore-tr-${depth}-${index}`)}>
      <td colSpan={tree.options.columns.length} style={{ padding: 0 }}>
        <div className={styles.tableCellInner}>
          <TableRowPlaceholder count={depth} />
          <div
            className={classNames(styles.container, styles[color], {
              [styles.isRoot]: !row,
              [styles.isLast]: !row || row.isLast(),
            })}
          >
            {entity.getIsLoadingMore() ? (
              <Spin size="small" />
            ) : (
              <button
                onClick={() => entity.loadMore()}
                type="button"
                className={classNames(styles.buttonLoadMore, {
                  [styles.isRoot]: !row,
                  [styles.isLast]: !row || row.isLast(),
                })}
                data-testid={createDataTestId(dataTestId, `loadmore-tr-button-${depth}-${index}`)}
              >
                {t("Load more")}
              </button>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}
