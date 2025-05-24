
import type { Metadata, Viewport } from 'next';
import './globals.css'; // Ensure global styles are imported at the very root
import { Roboto } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Toaster } from "@/components/ui/toaster";
import NextAuthProvider from '@/components/layout/NextAuthProvider'; // Import NextAuthProvider

// Setup Roboto font
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-roboto', // CSS variable for Roboto
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Chhuon MakaraRoth Dev - Portfolio',
  description: 'The personal portfolio of Chhuon MakaraRoth, showcasing web development projects, skills, and professional journey.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Apply Roboto and GeistMono font variables to the html tag
    <html lang="en" suppressHydrationWarning className={`${roboto.variable} ${GeistMono.variable}`}>
      {/* font-sans in body will now use --font-roboto via Tailwind config */}
      <body className={`antialiased font-sans bg-background text-foreground`}>
        <NextAuthProvider> {/* Wrap ThemeProvider with NextAuthProvider */}
          <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
