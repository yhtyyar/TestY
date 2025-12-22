import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { SystemMessages } from "widgets"

import { useAppSelector } from "app/hooks"

import { selectThemeValue } from "entities/system/model/slice-theme"

import { Auth } from "features/auth"
import { ChangeLang, ChangeTheme } from "features/system"

import DocumentationIcon from "shared/assets/icons/documentation.svg?react"
import LogoDark from "shared/assets/logo/testy-dark.svg?react"
import LogoLight from "shared/assets/logo/testy-light.svg?react"
import { Copyright } from "shared/ui"

import styles from "./styles.module.css"

export const LoginPage = () => {
  const themeValue = useAppSelector(selectThemeValue)
  const { t } = useTranslation()

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBlock}>
        <SystemMessages />
      </div>
      <div className={styles.settingsBlock}>
        <Link target="_blank" id="link-documentation" to="/docs/" className={styles.linkDocs}>
          <DocumentationIcon style={{ width: 18 }} />
          <span>{t("User manual")}</span>
        </Link>
        <ChangeTheme variant="borderless" />
        <ChangeLang variant="borderless" />
      </div>
      <div className={styles.body}>
        {themeValue === "dark" ? (
          <LogoDark className={styles.logo} />
        ) : (
          <LogoLight className={styles.logo} />
        )}
        <div className={styles.form}>
          <Auth />
        </div>
        <Copyright className={styles.footer} />
      </div>
    </div>
  )
}
