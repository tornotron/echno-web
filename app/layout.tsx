import './globals.css';
import { headers } from 'next/headers';
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The CSP nonce set in proxy.ts; passed to next-themes so its pre-hydration
  // theme script is nonced (otherwise the enforced policy blocks that inline script).
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <Providers>{children}</Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

export { defaultMetadata as metadata } from '@/lib/metadata';
