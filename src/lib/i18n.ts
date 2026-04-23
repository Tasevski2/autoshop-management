import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/locales/en/common.json'
import mk from '@/locales/mk/common.json'

const STORAGE_KEY = 'i18nextLng'

const savedLng = localStorage.getItem(STORAGE_KEY)

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      mk: { common: mk },
    },
    lng: savedLng || 'mk',
    defaultNS: 'common',
    fallbackLng: 'mk',
    interpolation: {
      escapeValue: false,
    },
  })

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
})

export default i18n
