import { MouseEventHandler } from "react"

import styles from "./stytles.module.css"

interface Props {
  onMouseDown: MouseEventHandler<HTMLButtonElement>
}

export const ColumnResizeIndicator = ({ onMouseDown }: Props) => {
  const updateCursor = () => {
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
  }

  const resetCursor = () => {
    document.body.style.removeProperty("cursor")
    document.body.style.removeProperty("user-select")
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    updateCursor()
    onMouseDown(e)

    const handleMouseUp = () => {
      document.removeEventListener("mouseup", handleMouseUp)
      resetCursor()
    }

    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <button type="button" className={styles.button} onMouseDown={handleMouseDown}>
      <div className={styles.line} />
    </button>
  )
}
