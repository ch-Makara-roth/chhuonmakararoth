
import type { Metadata } from 'next';
// Removed redundant import of '../globals.css';
import { AppHeader } from '@/components/layout/AppHeader';
// Removed Toaster and ThemeProvider, they are in the global layout
import TranslationsProvider from '@/components/layout/TranslationsProvider';
import initTranslations from '@/app/i18n';
import { languages, defaultNS } from '@/app/i18n/settings'; // defaultLocale removed as it's not used here directly
// Fonts are applied in the global layout

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export async function generateMetadata({ params: { lang } }: { params: { lang: string } }): Promise<Metadata> {
  const { t } = await initTranslations(lang, [defaultNS]);
  return {
    title: t('header.appName') + " - Portfolio",
    description: 'Personal portfolio of Chhuon MakaraRoth, showcasing projects, skills, and career journey.',
    // Viewport is in global metadata, no need to repeat here
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

  // This layout no longer renders <html> or <body> tags.
  // It provides the content that will go *inside* the <body> of src/app/layout.tsx
  return (
    <TranslationsProvider
      locale={lang}
      namespaces={i18nNamespaces}
      resources={resources}
    >
      {/* ThemeProvider is now in the global src/app/layout.tsx */}
      <AppHeader />
      <main className="flex-grow">
        {children}
      </main>
      {/* Toaster is now in the global src/app/layout.tsx */}
    </TranslationsProvider>
  );
}
