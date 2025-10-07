import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import { i18nConfig } from "shared/config/i18n-config.ts"
import { getLang } from "shared/libs/local-storage"

i18n.use(initReactI18next).init({
  resources: i18nConfig,
  lng: getLang(),
  fallbackLng: getLang(),
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
