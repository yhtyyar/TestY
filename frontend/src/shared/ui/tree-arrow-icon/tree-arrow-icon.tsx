import classNames from "classnames"

import ChevronIcon from "shared/assets/yi-icons/chevron.svg?react"

import styles from "./styles.module.css"

interface Props {
  isOpen?: boolean
  size?: number
  style?: React.CSSProperties
}

export const TreeArrowIcon = ({ isOpen = false, size = 16, style }: Props) => {
  return (
    <ChevronIcon
      className={classNames(styles.arrowIcon, {
        [styles.arrowIconOpen]: isOpen,
      })}
      style={{ minWidth: size, width: size, height: size, ...style }}
    />
  )
}
