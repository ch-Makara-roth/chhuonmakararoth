
'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { languages, defaultLocale } from '@/app/i18n/settings';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname(); // This is the path as seen in the browser
  const params = useParams();
  // currentLang here refers to the lang segment from the file system due to rewrite
  // For default locale, params.lang might be 'en' even if URL is `/about`
  // For non-default, params.lang will be e.g. 'km' and URL is `/km/about`
  const currentFsLang = typeof params.lang === 'string' ? params.lang : defaultLocale;
  const { t } = useTranslation('common');

  const changeLanguage = (newLocale: string) => {
    let pathWithoutLocale = pathname;

    // If the current path in browser includes a non-default locale prefix, remove it
    // Example: current browser path /km/about, currentFsLang is 'km'
    if (currentFsLang !== defaultLocale && pathname.startsWith(`/${currentFsLang}`)) {
      pathWithoutLocale = pathname.substring(`/${currentFsLang}`.length);
    }
    // If current browser path is /about (meaning currentFsLang is 'en'), pathWithoutLocale is already /about

    if (pathWithoutLocale === "") pathWithoutLocale = "/"; // Ensure root is represented by /

    let newPath;
    if (newLocale === defaultLocale) {
      newPath = pathWithoutLocale; // For default locale, no prefix
    } else {
      newPath = `/${newLocale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`; // Add prefix for non-default
    }
    
    if (newPath === "") newPath = "/";


    router.push(newPath);
    // router.refresh() might not be strictly necessary if Next.js handles transitions well
    // but can be kept to ensure server components re-evaluate with new lang context if needed.
    // However, since lang is in the path for non-default, or rewritten for default,
    // the layout and pages should re-render correctly.
  };

  // Determine what the user perceives as the current language based on URL
  const displayedLang = pathname.startsWith('/km') ? 'km' : 'en';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t('languageSwitcher.changeLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => changeLanguage(lng)}
            disabled={displayedLang === lng} // Disable based on displayed language
          >
            {lng.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
