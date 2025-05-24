'use client';

import { I18nextProvider } from 'react-i18next'; // appWithTranslation is not needed here
import { type ReactNode, useEffect, useState } from 'react';
import { createInstance, type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next'; // Corrected: use general initReactI18next
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
    newInstance.use(initReactI18next).init({ // Use initReactI18next from 'react-i18next'
      ...getOptions(locale, namespaces),
      resources: resources || undefined, 
      lng: locale, 
    });
    globalInstance = newInstance;
    return newInstance;
  });

  useEffect(() => {
    if (instance.language !== locale || (resources && instance.services.resourceStore.data !== resources) ) {
      const newInstance = createInstance();
      newInstance.use(initReactI18next).init({ // Use initReactI18next from 'react-i18next'
         ...getOptions(locale, namespaces),
        resources: resources || undefined,
        lng: locale,
      }, () => {
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


  if (!instance.isInitialized && !resources) { // If no resources, it might still be initializing via backend
     const init = async () => {
        const newInstance = createInstance();
        await newInstance.use(initReactI18next).init({ // Use initReactI18next from 'react-i18next'
            ...getOptions(locale, namespaces),
            lng: locale,
        });
        // Load resources if not pre-provided, for client-side case
        await newInstance.use(resourcesToBackend((language: string, namespace: string) =>
            import(`@/app/i18n/locales/${language}/${namespace}.json`))).loadNamespaces(namespaces);

        setInstance(newInstance);
        globalInstance = newInstance;
    };
    init(); 
    return null; 
  }
  
  if (!instance.isInitialized && resources) { // If resources provided, it should be initialized
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
    init();
    return null; // Or a loading skeleton
  }
  
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
