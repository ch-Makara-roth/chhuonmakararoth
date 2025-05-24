
'use client';

import { I18nextProvider } from 'react-i18next';
import { type ReactNode, useEffect, useState } from 'react';
import { createInstance, type i18n, type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions } from '@/app/i18n/settings';


interface TranslationsProviderProps {
  children: ReactNode;
  locale: string;
  namespaces: string[];
  resources?: Resource; 
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
      resources: resources || undefined, 
      lng: locale, 
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


  if (!instance.isInitialized && !resources) { 
     const init = async () => {
        const newInstance = createInstance();
        await newInstance.use(initReactI18next).init({ 
            ...getOptions(locale, namespaces),
            lng: locale,
        });
        await newInstance.use(resourcesToBackend((language: string, namespace: string) =>
            import(`@/app/i18n/locales/${language}/${namespace}.json`))).loadNamespaces(namespaces);

        setInstance(newInstance);
        globalInstance = newInstance;
    };
    init(); 
    return null; 
  }
  
  if (!instance.isInitialized && resources) { 
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
    return null; 
  }
  
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
