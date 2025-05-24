
import type { Metadata } from 'next';
import '../globals.css'; // Ensure global styles are imported
import { AppHeader } from '@/components/layout/AppHeader';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import TranslationsProvider from '@/components/layout/TranslationsProvider';
import initTranslations from '@/app/i18n';
import { languages, defaultNS } from '@/app/i18n/settings';
import { GeistSans } from 'geist/font/sans'; // Corrected import name
import { GeistMono } from 'geist/font/mono'; // Corrected import name

const geistSans = GeistSans({ // Corrected usage
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = GeistMono({ // Corrected usage
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export async function generateMetadata({ params: { lang } }: { params: { lang: string } }): Promise<Metadata> {
  const { t } = await initTranslations(lang, [defaultNS]);
  return {
    title: t('header.appName') + " - Portfolio",
    description: 'Personal portfolio of Chhuon MakaraRoth, showcasing projects, skills, and career journey.',
    viewport: 'width=device-width, initial-scale=1',
  };
}

const i18nNamespaces = [defaultNS];

export default async function RootLayout({
  children,
  params: { lang }
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  const { resources } = await initTranslations(lang, i18nNamespaces);

  return (
    <html lang={lang} suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className={`antialiased font-sans bg-background text-foreground`}>
        <TranslationsProvider
          locale={lang}
          namespaces={i18nNamespaces}
          resources={resources}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AppHeader />
            <main className="flex-grow">
              {children}
            </main>
            <Toaster />
          </ThemeProvider>
        </TranslationsProvider>
      </body>
    </html>
  );
}
