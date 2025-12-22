import classNames from "classnames"

import styles from "./styles.module.css"

export const TableHeader = ({ className, ...props }: React.ComponentProps<"thead">) => {
  return (
    <thead
      className={classNames(styles.tableHeader, className)}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1,
        width: "100%",
      }}
      {...props}
    />
  )
}
