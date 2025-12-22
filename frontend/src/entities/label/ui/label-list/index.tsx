import classNames from "classnames"
import { CSSProperties, ReactElement, useState } from "react"
import { useTranslation } from "react-i18next"

import { SkeletonLabelFilter } from "../label-filter/skeleton-label-filter"
import styles from "./styles.module.css"

interface Props {
  children: ReactElement[]
  isLoading?: boolean
  id: string
  showMore?: {
    text: string
    styles?: CSSProperties
  }
  rowCount?: number
  counterCls?: string
  showCount?: boolean
  showAll?: boolean
}

export const LabelList = ({
  children,
  id,
  isLoading,
  showMore,
  rowCount = 2,
  showAll = false,
}: Props) => {
  const { t } = useTranslation()
  const [showMoreState, setShowMoreState] = useState(false)

  const showMoreText = showMore?.text ?? t("Show more")

  if (isLoading) {
    return (
      <div style={{ marginTop: 8 }}>
        <SkeletonLabelFilter />
      </div>
    )
  }

  if (!children.length) {
    return <span className={styles.noData}>{t("No labels")}</span>
  }

  return (
    <div className={styles.wrapper}>
      <ul
        id={id}
        className={classNames(styles.list, {
          [styles.maxSize]: showMoreState || showAll,
        })}
        data-testid={id}
        style={{ maxHeight: !showAll ? rowCount * 26 : "auto" }}
      >
        {children}
      </ul>
      {!showAll && (
        <button
          type="button"
          className={styles.showButton}
          onClick={() => setShowMoreState(!showMoreState)}
          data-testid={`${id}-show-${showMoreState ? "less" : "more"}`}
          style={showMore?.styles}
        >
          {showMoreState ? t("Show less") : showMoreText}
        </button>
      )}
    </div>
  )
}
