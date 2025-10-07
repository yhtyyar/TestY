import classNames from "classnames"
import { useEffect, useRef, useState } from "react"

import { useTableProvider } from "../table-provider/table-provider"
import styles from "./styles.module.css"
import { TableBasic } from "./table-basic"
import { TableDraggable } from "./table-draggable"

export const Table = ({ className, ...props }: React.ComponentProps<"table">) => {
  const { data, enableColumnDragging, enableRowDragging } = useTableProvider()
  const tableComponentRef = useRef<HTMLDivElement>(null)
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(false)

  useEffect(() => {
    const container = tableComponentRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container
      const atRightEdge = scrollLeft >= scrollWidth - clientWidth - 1
      setShowLeftShadow(scrollLeft > 0)
      setShowRightShadow(!atRightEdge && scrollWidth > clientWidth)
    }

    handleScroll()

    container.addEventListener("scroll", handleScroll)
    window.addEventListener("resize", handleScroll)

    return () => {
      container.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [data])

  const tableClassName = classNames({
    [styles.leftShadowActive]: showLeftShadow,
    [styles.rightShadowActive]: showRightShadow,
  })

  return enableColumnDragging || enableRowDragging ? (
    <TableDraggable
      ref={tableComponentRef}
      className={className}
      tableContainerClassName={tableClassName}
      {...props}
    />
  ) : (
    <TableBasic
      ref={tableComponentRef}
      className={className}
      tableContainerClassName={tableClassName}
      {...props}
    />
  )
}
