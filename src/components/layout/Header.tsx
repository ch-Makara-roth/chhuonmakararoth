import Link from 'next/link';
import { ThemeSwitcher } from './ThemeSwitcher';
import { CodeXml } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-6">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <CodeXml className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">
            Chhuon MakaraRoth Dev
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4 sm:space-x-6 text-sm font-medium">
          <Link href="/#journey" className="text-foreground/60 transition-colors hover:text-foreground/80">
            Journey
          </Link>
          <Link href="/#skills" className="text-foreground/60 transition-colors hover:text-foreground/80">
            Skills
          </Link>
          <Link href="/#projects" className="text-foreground/60 transition-colors hover:text-foreground/80">
            Projects
          </Link>
          <Link href="/#contributions" className="text-foreground/60 transition-colors hover:text-foreground/80">
            Contributions
          </Link>
        </nav>
        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
