import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Header } from "@tanstack/react-table"
import classNames from "classnames"
import { CSSProperties } from "react"

import DotsIcon from "shared/assets/yi-icons/dots-2.svg?react"

import { useTreeProvider } from "../../tree-provider"
import { ColumnResizeIndicator } from "../column-resize-indicator/column-resize-indicator"
import styles from "./styles.module.css"

type Props<T> = React.ComponentProps<"th"> & {
  header: Header<T, unknown>
}

// eslint-disable-next-line comma-spacing
export const TableDraggableHead = <T,>({ className, children, header, ...props }: Props<T>) => {
  const { enableColumnDragging } = useTreeProvider()
  const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({
    id: header.column.id,
    disabled: !enableColumnDragging,
    data: {
      type: "column",
    },
  })

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition: "width transform 0.1s ease-in-out",
    whiteSpace: "nowrap",
    minWidth: header.getSize(),
    width: header.column.columnDef.meta?.fullWidth ? "100%" : header.getSize(),
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <th
      colSpan={header.colSpan}
      ref={setNodeRef}
      className={classNames(styles.tableHead, className)}
      style={style}
      {...props}
    >
      <div className={styles.thContent}>
        {children}
        <button {...attributes} {...listeners} className={styles.moveBtn}>
          <DotsIcon width={16} height={16} />
        </button>
        {header.column.getCanResize() && (
          <ColumnResizeIndicator onMouseDown={header.getResizeHandler()} />
        )}
      </div>
    </th>
  )
}
