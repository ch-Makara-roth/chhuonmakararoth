
import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';
import TranslationsProvider from '@/components/layout/TranslationsProvider';
import initTranslations from '@/app/i18n';
import { languages, defaultNS } from '@/app/i18n/settings';
import { Nokora } from 'next/font/google'; // Import Nokora

// Setup Nokora font
const nokoraFont = Nokora({
  subsets: ['khmer'],
  weight: ['400', '700', '900'], // Available weights for Nokora
  display: 'swap',
  // We'll use nokoraFont.className directly, so no need for a CSS variable here unless desired for other purposes
});

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export async function generateMetadata({ params: { lang } }: { params: { lang: string } }): Promise<Metadata> {
  const { t } = await initTranslations(lang, [defaultNS]);
  return {
    title: t('header.appName') + " - Portfolio",
    description: 'Personal portfolio of Chhuon MakaraRoth, showcasing projects, skills, and career journey.',
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

  // Determine font class based on language
  // Roboto is the default via src/app/layout.tsx and tailwind.config.ts (font-sans)
  // Nokora class will be applied here for Khmer to override the default
  const languageSpecificFontClassName = lang === 'km' ? nokoraFont.className : '';

  return (
    <TranslationsProvider
      locale={lang}
      namespaces={i18nNamespaces}
      resources={resources}
    >
      {/* This div will carry the conditional font class for Khmer */}
      <div className={languageSpecificFontClassName}>
        <AppHeader />
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </TranslationsProvider>
  );
}
