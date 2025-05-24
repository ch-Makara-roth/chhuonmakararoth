
import type { Metadata } from 'next';
import './globals.css'; // Ensure global styles are imported at the very root
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Toaster } from "@/components/ui/toaster";

// This metadata serves as a generic fallback.
// Routes under [lang] will have more specific metadata from [lang]/layout.tsx.
export const metadata: Metadata = {
  title: 'Chhuon MakaraRoth Dev - Portfolio',
  description: 'The personal portfolio of Chhuon MakaraRoth, showcasing web development projects, skills, and professional journey.',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The `lang` attribute is set here. For a fully dynamic `lang` based on segment,
    // this would require a more complex setup or a different i18n strategy.
    // For now, it defaults to "en".
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`antialiased font-sans bg-background text-foreground`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {/* Children will be the content from src/app/[lang]/layout.tsx or src/app/admin/layout.tsx etc. */}
            {children}
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
