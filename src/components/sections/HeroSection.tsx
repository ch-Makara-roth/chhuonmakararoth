
"use client";

import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const FULL_NAME = "Chhuon MakaraRoth";
const TYPING_SPEED_MS = 100; // Milliseconds per character
const START_TYPING_DELAY_MS = 1000; // Delay after "Hello, I'm" animates

export default function HeroSection() {
  const [typedName, setTypedName] = useState("");
  const [nameTypingComplete, setNameTypingComplete] = useState(false);
  const [showSubContent, setShowSubContent] = useState(false);

  useEffect(() => {
    // Start typing the name after the initial delay
    const nameTypingTimer = setTimeout(() => {
      let charIndex = 0;
      const intervalId = setInterval(() => {
        setTypedName((prev) => prev + FULL_NAME[charIndex]);
        charIndex++;
        if (charIndex === FULL_NAME.length) {
          clearInterval(intervalId);
          setNameTypingComplete(true);
        }
      }, TYPING_SPEED_MS);

      return () => clearInterval(intervalId);
    }, START_TYPING_DELAY_MS);

    return () => clearTimeout(nameTypingTimer);
  }, []);

  useEffect(() => {
    if (nameTypingComplete) {
      // Allow sub-content to animate in after a short delay
      const subContentTimer = setTimeout(() => {
        setShowSubContent(true);
      }, 300); // Delay before sub-content animates in
      return () => clearTimeout(subContentTimer);
    }
  }, [nameTypingComplete]);

  return (
    <section id="hero" className="w-full h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gradient-to-br from-background to-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="block animate-in fade-in slide-in-from-bottom-8 zoom-in-95 spin-in-[-1deg] duration-700 delay-300">
            Hello, I&apos;m
          </span>
          <span className="block text-primary mt-2 sm:mt-4 min-h-[1.2em] sm:min-h-[1.5em]">
            {typedName}
            {!nameTypingComplete && <span className="blinking-cursor">|</span>}
          </span>
        </h1>
        {/* Fallback for non-JS or before hydration for SEO */}
        <noscript>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block">Hello, I&apos;m</span>
            <span className="block text-primary mt-2 sm:mt-4">{FULL_NAME}</span>
          </h1>
        </noscript>

        {showSubContent && (
          <>
            <p className="mt-6 max-w-md mx-auto text-lg text-foreground/80 sm:text-xl md:mt-8 md:max-w-2xl animate-in fade-in slide-in-from-bottom-12 duration-700">
              A passionate Full-Stack Developer crafting modern, responsive, and user-centric web applications.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 animate-in fade-in slide-in-from-bottom-14 duration-700">
              <Button asChild size="lg" className="shadow-lg hover:shadow-primary/50 transition-shadow">
                <Link href="/#projects">View My Work</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="shadow-sm hover:shadow-accent/30 transition-shadow">
                <Link href="/#journey">My Journey <ArrowDown className="ml-2 h-4 w-4" /></Link>
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
