'use client';

import Image from 'next/image';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { AuthButton } from '@/components/common/auth-button';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/lib/styles/toast-styles';
import { Clock, BarChart2, Lock } from 'lucide-react';

function HomeContent() {
  const { status } = useSession();
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/users/dashboard');
    }
  }, [status, router]);

  useEffect(() => {
    // Check if user just logged out (client-side only)
    if (globalThis.window !== undefined) {
      const params = new URLSearchParams(globalThis.location.search);

      // Handle logout success
      if (params.get('logout') === 'success') {
        toast.success('Signed out successfully', {
          description: 'You have been logged out.',
        });
        // Clean up the URL parameter
        router.replace('/', { scroll: false });
      }

      // Handle logout/session errors
      const errorParam = params.get('error');
      if (errorParam) {
        switch (errorParam) {
          case 'logout_failed': {
            toast.error('Logout error', {
              description:
                'There was an issue signing you out. Please try again.',
            });
            break;
          }
          case 'session_invalid': {
            toast.warning('Session invalid', {
              description: 'Your session was invalid and has been cleared.',
            });
            break;
          }
          case 'session_expired':
          case 'SessionExpired': {
            toast.warning('Session expired', {
              description: 'Your session has expired. Please sign in again.',
            });
            break;
          }
          case 'session_revoked': {
            toast.warning('Session revoked', {
              description: 'Your session was terminated. Please sign in again.',
            });
            break;
          }
          default: {
            toast.info('Notice', {
              description: 'You have been signed out.',
            });
          }
        }
        // Clean up the URL parameter
        router.replace('/', { scroll: false });
      }
    }
  }, [router]);

  // Show loading state while checking auth or redirecting authenticated users
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-zinc-900 dark:border-zinc-100"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            {status === 'authenticated' ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-900 dark:to-black">
      {/* Navigation */}
      <nav className="relative z-10 px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image
              src="/e-ai-logo.png"
              alt="Echno Logo"
              width={110}
              height={40}
              className="dark:invert"
            />
          </div>
          <AuthButton />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl dark:text-zinc-100">
            Modern
            <span className="block bg-linear-to-r from-zinc-600 to-zinc-900 bg-clip-text text-transparent dark:from-zinc-400 dark:to-zinc-100">
              Construction Business Management
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl dark:text-zinc-400">
            Streamline your construction business operations with our
            comprehensive system. Real-time project monitoring, automated
            reporting, and seamless team management.
          </p>

          <div className="mb-16 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              onClick={() => signIn('keycloak')}
              size="lg"
              className="bg-zinc-900 px-8 py-3 text-lg text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-zinc-300 px-8 py-3 text-lg text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={() =>
                document
                  .querySelector('#features')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 h-20 w-20 animate-pulse rounded-full bg-zinc-200 opacity-20 dark:bg-zinc-800"></div>
        <div className="absolute top-40 right-20 h-16 w-16 animate-pulse rounded-full bg-zinc-300 opacity-30 delay-1000 dark:bg-zinc-700"></div>
        <div className="absolute bottom-20 left-20 h-12 w-12 animate-pulse rounded-full bg-zinc-400 opacity-25 delay-500 dark:bg-zinc-600"></div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="bg-white/50 px-4 py-20 backdrop-blur-sm dark:bg-zinc-900/50"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
              Everything you need for Construction Business Management
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Powerful features designed to simplify construction management and
              improve project efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-zinc-200 bg-white/80 backdrop-blur-sm transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800/80">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-700">
                  <Clock className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                </div>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                  Real-time Tracking
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Monitor attendance in real-time with instant updates and
                  notifications.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-zinc-200 bg-white/80 backdrop-blur-sm transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800/80">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-700">
                  <BarChart2 className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                </div>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                  Advanced Analytics
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Generate comprehensive reports and insights to optimize
                  workforce management.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-zinc-200 bg-white/80 backdrop-blur-sm transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800/80">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-700">
                  <Lock className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                </div>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                  Secure & Reliable
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Enterprise-grade security with Keycloak authentication and
                  data protection.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div>
              <div className="mb-2 text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                99.9%
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Uptime
              </div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                10k+
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Active Users
              </div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                24/7
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Support
              </div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                50+
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Companies
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-zinc-900 px-6 py-20 dark:bg-black">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            Ready to Transform your Construction Business Management?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-300">
            Join thousands of organizations already using Echno to streamline
            their workforce management.
          </p>
          <Button
            onClick={() => signIn('keycloak')}
            size="lg"
            className="bg-white px-8 py-3 text-lg text-zinc-900 hover:bg-zinc-100"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white/80 px-4 py-8 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-4 flex items-center justify-center space-x-2">
            <Image
              src="/e-ai-logo.png"
              alt="Echno Logo"
              width={60}
              height={40}
              className="dark:invert"
            />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            © {currentYear} Echno. Modern construction business management for
            the future.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-zinc-900 dark:border-zinc-100"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
