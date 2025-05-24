// src/app/i18n/settings.ts
export const fallbackLng = 'en'
export const languages = [fallbackLng, 'km']
export const defaultNS = 'common' // default namespace
export const cookieName = 'i18next'

export function getOptions (lng = fallbackLng, ns: string | string[] = defaultNS) {
  return {
    // debug: process.env.NODE_ENV === 'development', // Set to true for debugging
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  }
}
