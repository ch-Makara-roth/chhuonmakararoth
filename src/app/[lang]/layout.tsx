
import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';
import TranslationsProvider from '@/components/layout/TranslationsProvider';
import initTranslations from '@/app/i18n';
import { languages, defaultNS, defaultLocale } from '@/app/i18n/settings';
import { Nokora, Roboto } from 'next/font/google';

// Setup Roboto font (default sans-serif)
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-roboto',
  display: 'swap',
});

// Setup Nokora font (for Khmer)
const nokoraFont = Nokora({
  subsets: ['khmer'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-nokora', // Optional: if you want to target it specifically elsewhere
});

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

const APP_DEFAULT_TITLE = "Chhuon MakaraRoth Dev - Portfolio";
const APP_DESCRIPTION = 'Personal portfolio of Chhuon MakaraRoth, showcasing projects, skills, and career journey.';
// IMPORTANT: Replace this with your actual default OG image URL
const DEFAULT_OG_IMAGE_URL = "https://placehold.co/1200x630.png?text=My+Portfolio";


export async function generateMetadata({ params: { lang } }: { params: { lang: string } }): Promise<Metadata> {
  const { t } = await initTranslations(lang, [defaultNS]);
  const siteName = t('header.appName') || APP_DEFAULT_TITLE;
  const title = `${siteName} - Portfolio`;
  const description = APP_DESCRIPTION;
  // Assuming your app is hosted at process.env.NEXT_PUBLIC_APP_URL for og:url
  // For local dev, this might be http://localhost:9002. For prod, your actual domain.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const localeUrl = lang === defaultLocale ? appUrl : `${appUrl}/${lang}`;


  return {
    title: title,
    description: description,
    metadataBase: appUrl ? new URL(appUrl) : undefined,
    alternates: {
      canonical: '/',
      languages: {
        'en': '/en',
        'km': '/km',
      },
    },
    openGraph: {
      title: title,
      description: description,
      url: localeUrl || appUrl, // Fallback to appUrl if localeUrl is just appUrl + "/"
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
    // icons: { // Optional: Add favicon links if you have them in /public
    //   icon: '/favicon.ico',
    //   shortcut: '/favicon-16x16.png',
    //   apple: '/apple-touch-icon.png',
    // },
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

  const fontClassName = lang === 'km' ? nokoraFont.className : roboto.className;

  return (
    // The <html> and <body> tags are in the global src/app/layout.tsx
    // This layout applies language-specific fonts and i18n provider
    <TranslationsProvider
      locale={lang}
      namespaces={i18nNamespaces}
      resources={resources}
    >
      <div className={fontClassName}> {/* Apply language-specific font class */}
        <AppHeader />
        <main className="flex-grow">
          {children}
        </main>
        {/* Footer could go here */}
      </div>
    </TranslationsProvider>
  );
}
