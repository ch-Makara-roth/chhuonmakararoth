
'use client';
import Link, { type LinkProps } from 'next/link';
import { ThemeSwitcher } from './ThemeSwitcher';
import { CodeXml, Menu } from 'lucide-react'; // Added Menu icon
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { defaultLocale } from '@/app/i18n/settings';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState } from 'react'; // Added useState
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  // SheetClose, // Not explicitly needed if handleSmoothScroll closes it
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';

export function Header() {
  const { t, i18n } = useTranslation('common');
  const currentLang = i18n.language;
  const [isSheetOpen, setIsSheetOpen] = useState(false); // State for mobile menu

  const getLocalizedPath = (path: string) => {
    if (path.startsWith('/#')) {
        const hash = path.substring(1); 
        return currentLang === defaultLocale ? hash : `/${currentLang}${hash}`;
    }
    const normalizedPath = path === '/' ? '' : path;
    return currentLang === defaultLocale ? (normalizedPath || '/') : `/${currentLang}${normalizedPath || ''}`;
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, hrefAttributeValue: string) => {
    e.preventDefault(); 

    const fullUrl = new URL(hrefAttributeValue, window.location.origin);
    const targetId = fullUrl.hash.substring(1); 

    const targetPathForURLUpdate = currentLang === defaultLocale ? 
      (fullUrl.hash || '/') : 
      (`/${currentLang}` + (fullUrl.hash || (fullUrl.pathname === `/${currentLang}` ? '' : fullUrl.pathname.replace(`/${currentLang}`, '')) ));

    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
        });
        if (window.location.pathname + window.location.hash !== targetPathForURLUpdate) {
            window.history.pushState({}, '', targetPathForURLUpdate);
        }
      }
    } else if (hrefAttributeValue === getLocalizedPath('/')) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
       if (window.location.pathname + window.location.search + window.location.hash !== targetPathForURLUpdate) {
         window.history.pushState({}, '', targetPathForURLUpdate);
       }
    }
    
    // Close sheet if it's open
    if (isSheetOpen) {
      setIsSheetOpen(false);
    }
  };
  
  type NavLinkProps = Omit<LinkProps, 'onClick'> & {
    children: React.ReactNode;
    className?: string;
    href: string; 
  };

  const NavLink = ({ href, children, className, ...props }: NavLinkProps) => {
    return (
      <Link href={href} {...props} passHref legacyBehavior>
        <a onClick={(e) => handleSmoothScroll(e, href)} className={className}>
          {children}
        </a>
      </Link>
    );
  };

  const appNamePath = getLocalizedPath('/');
  const journeyPath = getLocalizedPath('/#journey');
  const skillsPath = getLocalizedPath('/#skills');
  const projectsPath = getLocalizedPath('/#projects');
  const contributionsPath = getLocalizedPath('/#contributions');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-6">
        <NavLink href={appNamePath} className="mr-6 flex items-center space-x-2">
          <CodeXml className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">
            {t('header.appName')}
          </span>
        </NavLink>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center space-x-4 sm:space-x-6 text-sm font-medium">
          <NavLink href={journeyPath} className="text-foreground/60 transition-colors hover:text-foreground/80">
            {t('header.journey')}
          </NavLink>
          <NavLink href={skillsPath} className="text-foreground/60 transition-colors hover:text-foreground/80">
            {t('header.skills')}
          </NavLink>
          <NavLink href={projectsPath} className="text-foreground/60 transition-colors hover:text-foreground/80">
            {t('header.projects')}
          </NavLink>
          <NavLink href={contributionsPath} className="text-foreground/60 transition-colors hover:text-foreground/80">
            {t('header.contributions')}
          </NavLink>
        </nav>

        {/* Right side items: Language Switcher, Theme Switcher, Mobile Menu Trigger */}
        <div className="flex items-center space-x-2">
          <LanguageSwitcher />
          <ThemeSwitcher />

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-6 pt-10 bg-background">
                <NavLink href={appNamePath} className="mb-8 flex items-center space-x-2">
                  <CodeXml className="h-7 w-7 text-primary" />
                  <span className="text-xl font-bold text-foreground">
                    {t('header.appName')}
                  </span>
                </NavLink>
                <nav className="flex flex-col space-y-4">
                  <NavLink href={journeyPath} className="text-lg py-2 text-foreground/80 hover:text-foreground transition-colors">
                    {t('header.journey')}
                  </NavLink>
                  <NavLink href={skillsPath} className="text-lg py-2 text-foreground/80 hover:text-foreground transition-colors">
                    {t('header.skills')}
                  </NavLink>
                  <NavLink href={projectsPath} className="text-lg py-2 text-foreground/80 hover:text-foreground transition-colors">
                    {t('header.projects')}
                  </NavLink>
                  <NavLink href={contributionsPath} className="text-lg py-2 text-foreground/80 hover:text-foreground transition-colors">
                    {t('header.contributions')}
                  </NavLink>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
