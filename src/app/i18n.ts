// src/app/i18n.ts
import { createInstance, type i18n as I18nInstanceType } from 'i18next';
import { initReactI18next } from 'react-i18next/server';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions, defaultNS } from './i18n/settings';

export default async function initTranslations(
  locale: string,
  namespaces: string[] = [defaultNS],
  i18nInstance?: I18nInstanceType,
  resources?: any
) {
  i18nInstance = i18nInstance || createInstance();

  i18nInstance.use(initReactI18next);

  if (!resources) {
    i18nInstance.use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`./i18n/locales/${language}/${namespace}.json`)
      )
    );
  }

  await i18nInstance.init(getOptions(locale, namespaces));

  return {
    i18n: i18nInstance,
    resources: resources || i18nInstance.services.resourceStore.data,
    t: i18nInstance.t
  };
}
