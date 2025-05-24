
"use client";

import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { defaultLocale } from '@/app/i18n/settings';

const TYPING_SPEED_MS = 100;
const ERASING_SPEED_MS = 50;
const PAUSE_AFTER_TYPING_MS = 2000;
const PAUSE_AFTER_ERASING_MS = 500;
const START_TYPING_DELAY_MS = 1000;

export default function HeroSection() {
  const { t, i18n } = useTranslation('common');
  // Use i18n.language as the source of truth for the current language
  const currentLang = i18n.language;
  const FULL_NAME = t('hero.name');

  const [typedName, setTypedName] = useState("");
  const [showBlinkingCursor, setShowBlinkingCursor] = useState(false);
  const [showSubContent, setShowSubContent] = useState(false);

  useEffect(() => {
    const initialDelayTimeout = setTimeout(() => {
      setShowBlinkingCursor(true);
      let index = 0;
      let currentDisplayedName = "";
      let phase: 'typing' | 'pausing_after_typing' | 'erasing' | 'pausing_after_erasing' = 'typing';
      let animationTimeoutId: NodeJS.Timeout | null = null;

      const runAnimationStep = () => {
        switch (phase) {
          case 'typing':
            setShowBlinkingCursor(true);
            if (index < FULL_NAME.length) {
              currentDisplayedName += FULL_NAME[index];
              setTypedName(currentDisplayedName);
              index++;
              animationTimeoutId = setTimeout(runAnimationStep, TYPING_SPEED_MS);
            } else {
              if (!showSubContent) {
                setShowSubContent(true);
              }
              phase = 'pausing_after_typing';
              setShowBlinkingCursor(false);
              animationTimeoutId = setTimeout(runAnimationStep, PAUSE_AFTER_TYPING_MS);
            }
            break;
          case 'pausing_after_typing':
            phase = 'erasing';
            setShowBlinkingCursor(true);
            animationTimeoutId = setTimeout(runAnimationStep, 0);
            break;
          case 'erasing':
            setShowBlinkingCursor(true);
            if (currentDisplayedName.length > 0) {
              currentDisplayedName = currentDisplayedName.slice(0, -1);
              setTypedName(currentDisplayedName);
              animationTimeoutId = setTimeout(runAnimationStep, ERASING_SPEED_MS);
            } else {
              phase = 'pausing_after_erasing';
              animationTimeoutId = setTimeout(runAnimationStep, PAUSE_AFTER_ERASING_MS);
            }
            break;
          case 'pausing_after_erasing':
            phase = 'typing';
            index = 0;
            currentDisplayedName = "";
            setShowBlinkingCursor(true);
            animationTimeoutId = setTimeout(runAnimationStep, 0);
            break;
        }
      };

      runAnimationStep();

      return () => {
        if (animationTimeoutId) clearTimeout(animationTimeoutId);
      };
    }, START_TYPING_DELAY_MS);

    return () => {
        clearTimeout(initialDelayTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [FULL_NAME, showSubContent]); 

  const getLocalizedPath = (path: string) => {
    if (path.startsWith('#')) { // Handle hash links
        return currentLang === defaultLocale ? path : `/${currentLang}${path}`;
    }
    const normalizedPath = path === '/' ? '' : path;
    return currentLang === defaultLocale ? (normalizedPath || '/') : `/${currentLang}${normalizedPath || ''}`;
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
              <Button asChild size="lg" className="shadow-lg hover:shadow-primary/50 transition-shadow">
                <Link href={getLocalizedPath('/#projects')}>{t('hero.viewWork')}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="shadow-sm hover:shadow-accent/30 transition-shadow">
                <Link href={getLocalizedPath('/#journey')}>{t('hero.myJourney')} <ArrowDown className="ml-2 h-4 w-4" /></Link>
              </Button>
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
