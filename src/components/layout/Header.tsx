'use client';
import Link from 'next/link';
import { ThemeSwitcher } from './ThemeSwitcher';
import { CodeXml } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useParams } from 'next/navigation';

export function Header() {
  const params = useParams();
  const lang = typeof params.lang === 'string' ? params.lang : 'en';
  const { t } = useTranslation('common');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-6">
        <Link href={`/${lang}/`} className="mr-6 flex items-center space-x-2">
          <CodeXml className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">
            {t('header.appName')}
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4 sm:space-x-6 text-sm font-medium">
          <Link href={`/${lang}/#journey`} className="text-foreground/60 transition-colors hover:text-foreground/80">
            {t('header.journey')}
          </Link>
          <Link href={`/${lang}/#skills`} className="text-foreground/60 transition-colors hover:text-foreground/80">
            {t('header.skills')}
          </Link>
          <Link href={`/${lang}/#projects`} className="text-foreground/60 transition-colors hover:text-foreground/80">
            {t('header.projects')}
          </Link>
          <Link href={`/${lang}/#contributions`} className="text-foreground/60 transition-colors hover:text-foreground/80">
            {t('header.contributions')}
          </Link>
        </nav>
        <div className="flex items-center space-x-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
