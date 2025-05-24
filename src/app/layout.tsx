
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
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`antialiased font-sans bg-background text-foreground`}>
        {/*
          ThemeProvider and Toaster are included here to ensure they are available
          globally. The [lang]/layout.tsx also has these, which might lead to nesting
          but is generally safe for these providers.
        */}
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
