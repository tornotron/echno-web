import './globals.css';
import { Providers } from '@/components/providers/auth-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/shadcn/sonner';

// Auth validation handled by Keycloak provider at runtime
// Missing/invalid env vars will produce descriptive errors when authentication is attempted

// Render every route per request so the CSP nonce set in proxy.ts reaches the
// scripts. Statically prerendered pages are served from cache with build-time HTML
// whose scripts carry no nonce, so the enforced nonce policy would block them. The
// app tree (/users/dashboard/*) is already dynamic; this brings the public and
// error pages along, trading their static caching for a working script nonce.
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

export { defaultMetadata as metadata } from '@/lib/metadata';
