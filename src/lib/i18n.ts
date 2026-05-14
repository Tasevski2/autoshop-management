import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/locales/en/common.json'
import mk from '@/locales/mk/common.json'

export const LANGUAGE = {
  MK: 'mk',
  EN: 'en',
} as const

export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE]

const STORAGE_KEY = 'i18nextLng'

const savedLng = localStorage.getItem(STORAGE_KEY)

i18n
  .use(initReactI18next)
  .init({
    resources: {
      [LANGUAGE.EN]: { common: en },
      [LANGUAGE.MK]: { common: mk },
    },
    lng: savedLng || LANGUAGE.MK,
    defaultNS: 'common',
    fallbackLng: LANGUAGE.MK,
    interpolation: {
      escapeValue: false,
    },
  })

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
})

export default i18n
