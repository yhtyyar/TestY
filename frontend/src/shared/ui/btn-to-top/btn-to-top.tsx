import classNames from "classnames"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import ChevronIcon from "shared/assets/yi-icons/chevron.svg?react"

import styles from "./styles.module.css"

export const BtnToTop = () => {
  const [isShow, setIsShow] = useState(false)
  const [searchParams] = useSearchParams()

  const handleVisibleButton = () => {
    setIsShow(window.pageYOffset > 500 && !searchParams?.has("test"))
  }

  const handleScrollUp = () => {
    window.scrollTo({ left: 0, top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    handleVisibleButton()

    window.addEventListener("scroll", handleVisibleButton)

    return () => {
      window.removeEventListener("scroll", handleVisibleButton)
    }
  }, [handleVisibleButton])

  return (
    <button
      type="button"
      className={classNames(styles.btn, { [styles.hide]: !isShow })}
      onClick={handleScrollUp}
    >
      <ChevronIcon style={{ transform: "rotate(180deg)" }} />
    </button>
  )
}
