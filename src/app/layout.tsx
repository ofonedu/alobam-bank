
import type { Metadata, Viewport } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google'; // Changed import
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  display: 'swap',
});

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Wohana Funds', // Updated App Name
  description: 'Experience banking designed for the digital age with excellent customer service.', // Updated description
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico', // Corrected path
    // apple: '/apple-icon.png', // Example for apple touch icon if you have one
  },
};

export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: 'hsl(var(--primary))' },
      { media: '(prefers-color-scheme: dark)', color: 'hsl(var(--primary))' },
    ],
  };
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${montserrat.variable} ${openSans.variable}`}>
      {/* Ensure PWA compatibility - manifest link is now in metadata */}
      {/* suppressHydrationWarning is often recommended with next-themes */}
      <head />
      <body className={`antialiased`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

