import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section id="hero" className="w-full h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gradient-to-br from-background to-secondary/30 relative">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="block">Hello, I&apos;m</span>
          <span className="block text-primary mt-2 sm:mt-4">Chhuon MakaraRoth</span>
        </h1>
        <p className="mt-6 max-w-md mx-auto text-lg text-foreground/80 sm:text-xl md:mt-8 md:max-w-2xl">
          A passionate Full-Stack Developer crafting modern, responsive, and user-centric web applications.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button asChild size="lg" className="shadow-lg hover:shadow-primary/50 transition-shadow">
            <Link href="/#projects">View My Work</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="shadow-sm hover:shadow-accent/30 transition-shadow">
            <Link href="/#journey">My Journey <ArrowDown className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown className="h-8 w-8 text-primary/50" />
      </div>
    </section>
  );
}
