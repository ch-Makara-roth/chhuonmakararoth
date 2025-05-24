// src/app/i18n/settings.ts
export const fallbackLng = 'en';
export const languages = [fallbackLng, 'km'];
export const defaultLocale = fallbackLng; // Explicitly export defaultLocale
export const defaultNS = 'common'; // default namespace
export const cookieName = 'i18next';

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

// Export i18n config object for middleware and other parts
export const i18n = {
  defaultLocale: defaultLocale,
  locales: languages,
};
