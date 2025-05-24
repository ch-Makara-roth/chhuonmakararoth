'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { languages } from '@/app/i18n/settings';
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
  const pathname = usePathname();
  const params = useParams();
  const currentLang = typeof params.lang === 'string' ? params.lang : 'en';
  const { t } = useTranslation('common');


  const changeLanguage = (newLocale: string) => {
    // Remove current locale from pathname
    let newPath = pathname;
    if (pathname.startsWith(`/${currentLang}`)) {
      newPath = pathname.substring(`/${currentLang}`.length);
      if (newPath === "") newPath = "/"; // Handle root case
    }
    
    // Prepend new locale
    newPath = `/${newLocale}${newPath === "/" && newLocale !== "" ? "" : newPath}`;
    if (newPath.endsWith('/') && newPath.length > 1 && !newPath.startsWith(`/${newLocale}/`)) { // avoid double slash for root path with locale
        newPath = newPath.slice(0, -1);
    }
     if (newPath === `/${newLocale}/` && newPath.length > newLocale.length +1 ) newPath = `/${newLocale}`;


    router.push(newPath);
    router.refresh(); // Force refresh to ensure server components re-render with new locale
  };

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
            disabled={currentLang === lng}
          >
            {lng.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
