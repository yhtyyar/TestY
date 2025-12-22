import { Divider, Typography } from "antd"
import classNames from "classnames"

import ArrowIcon from "shared/assets/yi-icons/arrow.svg?react"
import { useCacheState } from "shared/hooks"
import { Markdown } from "shared/ui"

import styles from "./styles.module.css"

interface IFieldProps {
  id: string
  dataTestId?: string
  title: string
  value: string | number | JSX.Element
  markdown?: boolean
  showLine?: boolean
  textStyles?: React.CSSProperties
  titleStyles?: React.CSSProperties
  colapsable?: boolean
}

export const Field = ({
  id,
  dataTestId,
  title,
  value,
  markdown = false,
  showLine = true,
  textStyles = {},
  titleStyles = { fontSize: 16, fontWeight: 500 },
  colapsable = true,
}: IFieldProps) => {
  const [expanded, setExpanded] = useCacheState(id, true, (cacheValue) => cacheValue === "true")

  if (!value) return null

  const handleToggle = () => {
    if (colapsable) {
      setExpanded(!expanded)
    }
  }

  const renderTitle = () => (
    <div
      className={classNames(styles.title, { [styles.clickable]: colapsable })}
      style={titleStyles}
      onClick={handleToggle}
    >
      {colapsable && (
        <ArrowIcon
          className={classNames(styles.arrow, { [styles.expanded]: expanded })}
          width={16}
          height={16}
        />
      )}
      <span>{title}</span>
    </div>
  )

  const renderContent = () => {
    if (!expanded) return null

    return markdown ? (
      <div id={id} data-testid={dataTestId} style={textStyles}>
        <Markdown content={String(value)} />
      </div>
    ) : (
      <Typography>
        <Typography.Paragraph id={id}>
          <Typography.Text
            style={{ whiteSpace: "pre-wrap", ...textStyles }}
            data-testid={dataTestId}
          >
            {value}
          </Typography.Text>
        </Typography.Paragraph>
      </Typography>
    )
  }

  return (
    <div className={styles.field}>
      {showLine ? (
        <Divider
          orientation="left"
          orientationMargin={0}
          style={{ marginTop: 0, marginBottom: 8, ...titleStyles }}
        >
          {renderTitle()}
        </Divider>
      ) : (
        renderTitle()
      )}
      {renderContent()}
    </div>
  )
}
