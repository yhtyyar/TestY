import { useTranslation } from "react-i18next"

import { i18nConfig } from "shared/config/i18n-config"
import { LangType } from "shared/ui"

type NsKeys = keyof typeof i18nConfig.en

export const useMyTranslation = (ns?: NsKeys[]) => {
  const { t, i18n } = useTranslation(ns)

  return {
    t,
    i18n,
    language: i18n.language as LangType,
  }
}
