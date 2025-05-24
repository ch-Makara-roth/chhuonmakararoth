
// src/app/i18n.ts
import { createInstance, type i18n as I18nInstanceType, type Resource } from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions, defaultNS } from './i18n/settings';

export default async function initTranslations(
  locale: string,
  namespaces: string[] = [defaultNS],
  i18nInstance?: I18nInstanceType,
  resources?: Resource 
) {
  i18nInstance = i18nInstance || createInstance();

  // Do not call i18nInstance.use(initReactI18next) here for server-side.
  // This is handled by the TranslationsProvider for client-side React integration.

  if (!resources) {
    i18nInstance.use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`@/app/i18n/locales/${language}/${namespace}.json`) // Changed to alias
      )
    );
  }

  await i18nInstance.init(getOptions(locale, namespaces));

  return {
    i18n: i18nInstance,
    resources: resources || i18nInstance.services.resourceStore.data as Resource,
    t: i18nInstance.t
  };
}
