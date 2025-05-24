'use client';

import { I18nextProvider, appWithTranslation } from 'react-i18next';
import { type ReactNode, useEffect, useState } from 'react';
import { createInstance, type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next'; // For client
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions } from '@/app/i18n/settings';


interface TranslationsProviderProps {
  children: ReactNode;
  locale: string;
  namespaces: string[];
  resources?: any; 
}

let globalInstance: i18n | null = null;

export default function TranslationsProvider({
  children,
  locale,
  namespaces,
  resources
}: TranslationsProviderProps) {
  
  const [instance, setInstance] = useState(() => {
    if (globalInstance && globalInstance.language === locale) {
      return globalInstance;
    }
    const newInstance = createInstance();
    newInstance.use(initReactI18next).init({
      ...getOptions(locale, namespaces),
      resources: resources || undefined, // if resources provided, use them
      lng: locale, // ensure lng is set
    });
    globalInstance = newInstance;
    return newInstance;
  });

  useEffect(() => {
    if (instance.language !== locale || (resources && instance.services.resourceStore.data !== resources) ) {
      const newInstance = createInstance();
      newInstance.use(initReactI18next).init({
         ...getOptions(locale, namespaces),
        resources: resources || undefined,
        lng: locale,
      }, () => {
        // Callback after init to ensure resources are loaded if not pre-provided
        if (!resources) {
          newInstance.use(resourcesToBackend((language: string, namespace: string) =>
            import(`@/app/i18n/locales/${language}/${namespace}.json`)));
        }
      });
      setInstance(newInstance);
      globalInstance = newInstance;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, namespaces, resources]);


  if (!instance.isInitialized) {
     // Fallback for when instance is not ready, or render children optimistically
     // This might show untranslated content briefly if resources are fetched async client-side
     // For server-provided resources, it should be initialized.
    const init = async () => {
        const newInstance = createInstance();
        await newInstance.use(initReactI18next).init({
            ...getOptions(locale, namespaces),
            resources,
            lng: locale,
        });
        setInstance(newInstance);
        globalInstance = newInstance;
    };
    if (resources) init(); // Initialize if resources are available
    return null; // Or a loading skeleton
  }
  
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
