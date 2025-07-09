
import type { Metadata, Viewport } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';
import TranslationsProvider from '@/components/layout/TranslationsProvider';
import initTranslations from '@/app/i18n';
import { languages, defaultNS, defaultLocale } from '@/app/i18n/settings';
import { Nokora } from 'next/font/google';
// Roboto is applied globally via src/app/layout.tsx and tailwind.config.ts
// We only need Nokora here for specific Khmer language styling.
import './../globals.css'; // Adjusted path to import from parent
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Toaster } from "@/components/ui/toaster";
// NextAuthProvider is in the global root layout

// Setup Nokora font (for Khmer)
const nokoraFont = Nokora({
  subsets: ['khmer'],
  weight: ['400', '700', '900'],
  display: 'swap',
  // No need to set variable if using .className directly
});

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

const APP_DEFAULT_TITLE = "Chhuon MakaraRoth Dev - Portfolio";
const APP_DESCRIPTION = 'Personal portfolio of Chhuon MakaraRoth, showcasing projects, skills, and career journey.';
const DEFAULT_OG_IMAGE_URL = "https://placehold.co/1200x630.png?text=My+Portfolio"; // Replace this

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await initTranslations(lang, [defaultNS]);
  const siteName = t('header.appName') || APP_DEFAULT_TITLE;
  const title = `${siteName} - Portfolio`;
  const description = APP_DESCRIPTION;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const localeUrl = lang === defaultLocale ? appUrl : `${appUrl}/${lang}`;

  return {
    title: title,
    description: description,
    metadataBase: appUrl ? new URL(appUrl) : undefined,
    alternates: {
      canonical: lang === defaultLocale ? '/' : `/${lang}`,
      languages: languages.reduce((acc, l) => {
        acc[l] = l === defaultLocale ? '/' : `/${l}`;
        return acc;
      }, {} as Record<string, string>),
    },
    openGraph: {
      title: title,
      description: description,
      url: localeUrl || appUrl,
      siteName: siteName,
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: 'Chhuon MakaraRoth Developer Portfolio',
        },
      ],
      locale: lang,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [DEFAULT_OG_IMAGE_URL],
      // creator: '@yourTwitterHandle', // Optional: Add your Twitter handle
    },
  };
}

const i18nNamespaces = [defaultNS];

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  const { lang } = await params;
  const { resources } = await initTranslations(lang, i18nNamespaces);

  // Conditional font application logic
  const fontClassName = lang === 'km' ? nokoraFont.className : '';

  // This layout is specific to [lang] routes and should NOT contain <html> or <body>
  // Those are provided by the global src/app/layout.tsx
  return (
    <TranslationsProvider
      locale={lang}
      namespaces={i18nNamespaces}
      resources={resources}
    >
      {/* Apply language-specific font class to a wrapper div */}
      <div className={`${fontClassName} flex flex-col min-h-screen`}>
        <AppHeader />
        <main className="flex-grow">
          {children}
        </main>
        {/* Footer could go here if it needs language context */}
      </div>
    </TranslationsProvider>
  );
}
