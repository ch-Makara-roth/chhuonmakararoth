
"use client";

import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { defaultLocale } from '@/app/i18n/settings';

const TYPING_SPEED_MS = 100;
const ERASING_SPEED_MS = 50;
const PAUSE_AFTER_TYPING_MS = 2000;
const PAUSE_AFTER_ERASING_MS = 500;
const START_TYPING_DELAY_MS = 1000;

export default function HeroSection() {
  const { t, i18n } = useTranslation('common');
  const currentLang = i18n.language;
  const FULL_NAME = t('hero.name');

  const [typedName, setTypedName] = useState("");
  const [showBlinkingCursor, setShowBlinkingCursor] = useState(false);
  const [showSubContent, setShowSubContent] = useState(false);

  const initialDelayTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const animationStepTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (initialDelayTimeoutIdRef.current) {
      clearTimeout(initialDelayTimeoutIdRef.current);
      initialDelayTimeoutIdRef.current = null;
    }
    if (animationStepTimeoutIdRef.current) {
      clearTimeout(animationStepTimeoutIdRef.current);
      animationStepTimeoutIdRef.current = null;
    }

    setTypedName("");
    setShowBlinkingCursor(false);
    setShowSubContent(false);

    initialDelayTimeoutIdRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setShowBlinkingCursor(true);

      let index = 0;
      let currentDisplayedName = "";
      let phase: 'typing' | 'pausing_after_typing' | 'erasing' | 'pausing_after_erasing' = 'typing';

      const runAnimationStep = () => {
        if (!isMountedRef.current) {
          if (animationStepTimeoutIdRef.current) clearTimeout(animationStepTimeoutIdRef.current);
          return;
        }

        switch (phase) {
          case 'typing':
            setShowBlinkingCursor(true);
            if (index < FULL_NAME.length) {
              currentDisplayedName += FULL_NAME[index];
              if (isMountedRef.current) setTypedName(currentDisplayedName);
              index++;
              animationStepTimeoutIdRef.current = setTimeout(runAnimationStep, TYPING_SPEED_MS);
            } else {
              if (isMountedRef.current && !showSubContent) {
                setShowSubContent(true);
              }
              phase = 'pausing_after_typing';
              setShowBlinkingCursor(false); // Hide cursor during pause after typing
              animationStepTimeoutIdRef.current = setTimeout(runAnimationStep, PAUSE_AFTER_TYPING_MS);
            }
            break;
          case 'pausing_after_typing':
            phase = 'erasing';
            setShowBlinkingCursor(true); // Show cursor for erasing
            animationStepTimeoutIdRef.current = setTimeout(runAnimationStep, 0);
            break;
          case 'erasing':
            setShowBlinkingCursor(true);
            if (currentDisplayedName.length > 0) {
              currentDisplayedName = currentDisplayedName.slice(0, -1);
              if (isMountedRef.current) setTypedName(currentDisplayedName);
              animationStepTimeoutIdRef.current = setTimeout(runAnimationStep, ERASING_SPEED_MS);
            } else {
              phase = 'pausing_after_erasing';
              animationStepTimeoutIdRef.current = setTimeout(runAnimationStep, PAUSE_AFTER_ERASING_MS);
            }
            break;
          case 'pausing_after_erasing':
            phase = 'typing';
            index = 0;
            setShowBlinkingCursor(true); // Show cursor for typing
            animationStepTimeoutIdRef.current = setTimeout(runAnimationStep, 0);
            break;
        }
      };
      if (isMountedRef.current) {
        runAnimationStep();
      }
    }, START_TYPING_DELAY_MS);

    return () => {
      isMountedRef.current = false;
      if (initialDelayTimeoutIdRef.current) {
        clearTimeout(initialDelayTimeoutIdRef.current);
        initialDelayTimeoutIdRef.current = null;
      }
      if (animationStepTimeoutIdRef.current) {
        clearTimeout(animationStepTimeoutIdRef.current);
        animationStepTimeoutIdRef.current = null;
      }
    };
  }, [FULL_NAME]);

  const getLocalizedPath = (path: string) => {
    if (path.startsWith('#')) {
      return currentLang === defaultLocale ? path : `/${currentLang}${path}`;
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
      (`/${currentLang}` + (fullUrl.hash || (fullUrl.pathname === `/${currentLang}` ? '' : fullUrl.pathname.replace(`/${currentLang}`, ''))));

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
    }
  };

  return (
    <section id="hero" className="w-full h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gradient-to-br from-background to-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="block animate-in fade-in slide-in-from-bottom-8 zoom-in-95 spin-in-[-1deg] duration-700 delay-300">
            {t('hero.greeting')}
          </span>
          <span className="block text-primary mt-2 sm:mt-4 min-h-[1.2em] sm:min-h-[1.5em]">
            {typedName}
            {showBlinkingCursor && <span className="blinking-cursor">|</span>}
          </span>
        </h1>
        <noscript>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block">{t('hero.greeting')}</span>
            <span className="block text-primary mt-2 sm:mt-4">{FULL_NAME}</span>
          </h1>
        </noscript>

        {showSubContent && (
          <>
            <p className="mt-6 max-w-md mx-auto text-lg text-foreground/80 sm:text-xl md:mt-8 md:max-w-2xl animate-in fade-in slide-in-from-bottom-12 duration-700">
              {t('hero.tagline')}
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 animate-in fade-in slide-in-from-bottom-14 duration-700">
              <Link href={getLocalizedPath('/#projects')} passHref legacyBehavior>
                <Button 
                  asChild 
                  size="lg" 
                  className="shadow-lg hover:shadow-primary/50 transition-shadow"
                  onClick={(e) => handleSmoothScroll(e as unknown as React.MouseEvent<HTMLAnchorElement>, getLocalizedPath('/#projects'))}
                >
                  <a>{t('hero.viewWork')}</a>
                </Button>
              </Link>
              <Link href={getLocalizedPath('/#journey')} passHref legacyBehavior>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="shadow-sm hover:shadow-accent/30 transition-shadow"
                  onClick={(e) => handleSmoothScroll(e as unknown as React.MouseEvent<HTMLAnchorElement>, getLocalizedPath('/#journey'))}
                >
                  <a>{t('hero.myJourney')} <ArrowDown className="ml-2 h-4 w-4" /></a>
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
      {showSubContent && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce delay-700 duration-1000">
          <ArrowDown className="h-8 w-8 text-primary/50" />
        </div>
      )}
    </section>
  );
}
