
'use client';
import Link, { type LinkProps } from 'next/link';
import { ThemeSwitcher } from './ThemeSwitcher';
import { CodeXml } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { defaultLocale } from '@/app/i18n/settings';
import { useRouter } from 'next/navigation';
import type React from 'react';

export function Header() {
  const { t, i18n } = useTranslation('common');
  // useRouter is initialized but not directly used in this version of smooth scroll.
  // It could be used if we wanted router.push(href, { scroll: false }) for URL updates.
  // const router = useRouter(); 
  const currentLang = i18n.language;

  const getLocalizedPath = (path: string) => {
    // Handles hash links that point to sections on the current page.
    // e.g. path = "/#journey"
    if (path.startsWith('/#')) {
        const hash = path.substring(1); // -> #journey
        return currentLang === defaultLocale ? hash : `/${currentLang}${hash}`;
    }
    // Handles root path / for the app logo/name.
    // e.g. path = "/"
    const normalizedPath = path === '/' ? '' : path;
    return currentLang === defaultLocale ? (normalizedPath || '/') : `/${currentLang}${normalizedPath || ''}`;
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, hrefAttributeValue: string) => {
    e.preventDefault(); // Prevent default link behavior to implement custom scroll

    // Use window.location.origin as base if hrefAttributeValue is relative (e.g. '#journey' or '/km#journey')
    const fullUrl = new URL(hrefAttributeValue, window.location.origin);
    const targetId = fullUrl.hash.substring(1); // Get id from #hash (remove #)

    const targetPathForURLUpdate = currentLang === defaultLocale ? 
      (fullUrl.hash || '/') : 
      (`/${currentLang}` + (fullUrl.hash || (fullUrl.pathname === `/${currentLang}` ? '' : fullUrl.pathname.replace(`/${currentLang}`, '')) ));


    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
        });
        // Update URL hash after scroll
        if (window.location.pathname + window.location.hash !== targetPathForURLUpdate) {
            window.history.pushState({}, '', targetPathForURLUpdate);
        }
      } else {
        // Fallback if element not found (should not happen for same-page section links)
        // router.push(hrefAttributeValue);
      }
    } else if (hrefAttributeValue === getLocalizedPath('/')) {
      // This is for the main logo/app name link, scroll to top
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
       // Update URL to root after scroll
       if (window.location.pathname + window.location.search + window.location.hash !== targetPathForURLUpdate) {
         window.history.pushState({}, '', targetPathForURLUpdate);
       }
    } else {
        // For other links without a hash, navigate using Next Router (though header doesn't have these now)
        // router.push(hrefAttributeValue);
        // For safety, if it's a non-hash link that's not the root, just let default behavior happen or use router.
        // This block is unlikely to be hit with current header structure.
    }
  };

  // Define paths once
  const appNamePath = getLocalizedPath('/');
  const journeyPath = getLocalizedPath('/#journey');
  const skillsPath = getLocalizedPath('/#skills');
  const projectsPath = getLocalizedPath('/#projects');
  const contributionsPath = getLocalizedPath('/#contributions');
  
  type NavLinkProps = Omit<LinkProps, 'onClick'> & {
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
    children: React.ReactNode;
    className?: string;
    href: string; // Ensure href is always a string for our handler
  };

  // Custom NavLink component to handle smooth scroll
  const NavLink = ({ href, children, className, ...props }: NavLinkProps) => {
    return (
      <Link href={href} {...props} passHref legacyBehavior>
        <a onClick={(e) => handleSmoothScroll(e, href)} className={className}>
          {children}
        </a>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-6">
        <NavLink href={appNamePath} className="mr-6 flex items-center space-x-2">
          <CodeXml className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">
            {t('header.appName')}
          </span>
        </NavLink>
        <nav className="flex flex-1 items-center space-x-4 sm:space-x-6 text-sm font-medium">
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
        <div className="flex items-center space-x-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
