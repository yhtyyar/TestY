import { CloseOutlined, EditOutlined } from "@ant-design/icons"
import { Tag, Tooltip } from "antd"
import classNames from "classnames"
import { useMemo } from "react"

import { Button } from "shared/ui"

import styles from "./styles.module.css"

const TRUNCATED_LENGTH = 20

interface LabelProps {
  id?: string
  content: string
  color: string | null
  lineThrough?: boolean
  onClick?: (label: SelectedLabel) => void
  onDelete?: (label: SelectedLabel) => void
  onEdit?: (label: SelectedLabel) => void
  className?: string
  truncate?: boolean
  tooltip?: boolean
}

export const Label = ({
  id,
  content,
  color,
  onDelete,
  onClick,
  onEdit,
  className,
  lineThrough = false,
  truncate = false,
  tooltip = true,
}: LabelProps) => {
  const labelText = useMemo(() => {
    if (!truncate) return content
    return content.length > TRUNCATED_LENGTH ? `${content.slice(0, TRUNCATED_LENGTH)}...` : content
  }, [content])

  return (
    <Tag
      id={id}
      key={id}
      className={classNames(styles.label, className)}
      color={color ?? undefined}
      style={{
        cursor: onClick ? "pointer" : "default",
        textDecoration: lineThrough ? "line-through" : undefined,
      }}
      onClick={onClick ? () => onClick({ label: content, color }) : undefined}
      data-testid={`label-${content}`}
    >
      {content.length < TRUNCATED_LENGTH ? (
        labelText
      ) : tooltip ? (
        <Tooltip title={content}>{labelText}</Tooltip>
      ) : (
        labelText
      )}
      {onEdit && (
        <Button
          id="label-edit"
          className={styles.btn}
          icon={<EditOutlined style={{ fontSize: 10 }} />}
          color="accent"
          shape="circle"
          size="s"
          onClick={(e) => {
            e.stopPropagation()
            onEdit({ label: content, color })
          }}
          data-testid={`label-edit-${content}`}
        />
      )}
      {onDelete && (
        <Button
          id="label-delete"
          className={styles.btn}
          icon={<CloseOutlined style={{ fontSize: 10 }} />}
          color="ghost"
          shape="circle"
          size="s"
          onClick={(e) => {
            e.stopPropagation()
            onDelete({ label: content, color })
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
          }}
          data-testid={`label-delete-${content}`}
        />
      )}
    </Tag>
  )
}
