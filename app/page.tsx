'use client';

import Image from 'next/image';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense, useState } from 'react';
import { AuthButton } from '@/components/common/auth-button';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/lib/styles/toast-styles';
import {
  Clock,
  BarChart2,
  Lock,
  Users,
  FileText,
  Zap,
  Globe,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Play,
  HardHat,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';

function HomeContent() {
  const { status } = useSession();
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'About Us', href: '/about' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Contact', href: '/contact' },
  ];

  const scrollToSection = (href: string) => {
    if (href.startsWith('/')) {
      router.push(href);
      setMobileMenuOpen(false);
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    // Check if user just logged out or has session errors (client-side only)
    if (globalThis.window !== undefined) {
      const params = new URLSearchParams(globalThis.location.search);

      // Don't redirect authenticated users if they have session errors
      const hasErrorParam = params.has('error');
      if (hasErrorParam && status === 'authenticated') {
        // Session error detected but user still shows as authenticated
        // Let NextAuth handle the logout, don't redirect yet
        return;
      }

      // Normal redirect for authenticated users without errors
      if (status === 'authenticated' && !hasErrorParam) {
        router.push('/users/dashboard');
      }
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
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Image
                src="/e-ai-logo.png"
                alt="Echno Logo"
                width={110}
                height={40}
                className="dark:invert"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center space-x-8 md:flex">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {link.name}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden items-center space-x-4 md:flex">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/contact#demo')}
                className="border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Request Demo
              </Button>
              <AuthButton />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2 md:hidden">
              <AuthButton />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-zinc-200 bg-white md:hidden dark:border-zinc-800 dark:bg-zinc-900">
            <div className="space-y-3 px-4 py-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-base font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  {link.name}
                </button>
              ))}
              <Button
                onClick={() => router.push('/contact#demo')}
                className="mt-2 w-full"
                variant="outline"
              >
                Request Demo
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <Zap className="mr-2 h-4 w-4 text-amber-500" />
                Trusted by 50+ Construction Companies
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
                Modern
                <span className="block bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text pb-1 text-transparent dark:from-blue-400 dark:to-indigo-400">
                  Construction Business Management
                </span>
              </h1>

              <p className="mb-8 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Streamline your construction operations with our comprehensive
                platform. Real-time project monitoring, automated reporting, and
                seamless team management.
              </p>

              <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <Button
                  onClick={() => signIn('keycloak')}
                  size="lg"
                  className="bg-zinc-900 px-8 py-3 text-lg text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-zinc-300 px-8 py-3 text-lg text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  onClick={() => scrollToSection('#demo')}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl border border-zinc-200 bg-linear-to-br from-blue-500/10 to-indigo-500/10 p-8 dark:border-zinc-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="mb-3 flex items-center space-x-3">
                      <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                        <HardHat className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Active Projects
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      24
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="mb-3 flex items-center space-x-3">
                      <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                        <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Team Members
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      156
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="mb-3 flex items-center space-x-3">
                      <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
                        <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Tasks
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      342
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="mb-3 flex items-center space-x-3">
                      <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                        <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Efficiency
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      94%
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl"></div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-32 left-10 h-20 w-20 animate-pulse rounded-full bg-blue-200 opacity-20 dark:bg-blue-800"></div>
        <div className="absolute top-60 right-20 h-16 w-16 animate-pulse rounded-full bg-indigo-300 opacity-30 delay-1000 dark:bg-indigo-700"></div>
      </section>

      {/* Trusted By Section */}
      <section className="border-y border-zinc-200 bg-zinc-50/50 py-12 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4">
          <p className="mb-8 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
            TRUSTED BY LEADING CONSTRUCTION COMPANIES
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 md:gap-16">
            <div className="text-xl font-bold text-zinc-400 dark:text-zinc-600">
              BuildCorp
            </div>
            <div className="text-xl font-bold text-zinc-400 dark:text-zinc-600">
              ConstructPro
            </div>
            <div className="text-xl font-bold text-zinc-400 dark:text-zinc-600">
              SkylineBuilders
            </div>
            <div className="text-xl font-bold text-zinc-400 dark:text-zinc-600">
              MetroConstruct
            </div>
            <div className="text-xl font-bold text-zinc-400 dark:text-zinc-600">
              PrimeBuild
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Features
            </div>
            <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
              Everything you need for Construction Management
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Powerful features designed to simplify construction operations and
              improve project efficiency across your entire organization.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group border-zinc-200 bg-white backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800/80">
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 transition-transform group-hover:scale-110 dark:bg-blue-900/30">
                  <Clock className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                  Real-time Tracking
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Monitor attendance, project progress, and resource allocation
                  in real-time with instant updates and notifications.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-zinc-200 bg-white backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800/80">
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 transition-transform group-hover:scale-110 dark:bg-green-900/30">
                  <BarChart2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                  Advanced Analytics
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Generate comprehensive reports and insights to optimize
                  workforce management and project timelines.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-zinc-200 bg-white backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800/80">
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 transition-transform group-hover:scale-110 dark:bg-purple-900/30">
                  <Lock className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                  Secure & Reliable
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Enterprise-grade security with Keycloak authentication,
                  role-based access, and data protection.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-zinc-200 bg-white backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800/80">
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 transition-transform group-hover:scale-110 dark:bg-amber-900/30">
                  <Users className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                  Team Management
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Effortlessly manage teams, assign tasks, and track performance
                  across multiple project sites.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-zinc-200 bg-white backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800/80">
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 transition-transform group-hover:scale-110 dark:bg-red-900/30">
                  <FileText className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                  Document Management
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Centralized document storage with version control, approvals,
                  and easy sharing capabilities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-zinc-200 bg-white backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800/80">
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 transition-transform group-hover:scale-110 dark:bg-indigo-900/30">
                  <Globe className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                  Multi-site Support
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Manage multiple construction sites from a single dashboard
                  with location-based insights.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* View All Features Button */}
          <div className="mt-12 text-center">
            <Button
              onClick={() => router.push('/features')}
              size="lg"
              variant="outline"
              className="border-zinc-300 px-8 py-3 text-lg text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              View All Features
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="bg-zinc-50 px-4 py-24 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                About Us
              </div>
              <h2 className="mb-6 text-3xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
                Building the Future of Construction Management
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Founded with a vision to revolutionize the construction
                industry, Echno provides cutting-edge solutions that help
                construction companies streamline operations, improve
                efficiency, and deliver projects on time.
              </p>
              <p className="mb-8 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Our platform combines years of industry expertise with modern
                technology to create tools that construction professionals
                actually want to use. From project managers to field workers,
                everyone benefits from our intuitive system.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600 dark:text-green-400" />
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Industry Expertise
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      10+ years of construction industry experience
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600 dark:text-green-400" />
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Customer First
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Dedicated support team available 24/7
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600 dark:text-green-400" />
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Innovation Driven
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Regular updates with new features
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600 dark:text-green-400" />
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Secure Platform
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Enterprise-grade security standards
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-zinc-200 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-800">
                <div className="mb-2 text-4xl font-bold text-blue-600 dark:text-blue-400">
                  99.9%
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Uptime Guarantee
                </div>
              </Card>
              <Card className="border-zinc-200 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-800">
                <div className="mb-2 text-4xl font-bold text-green-600 dark:text-green-400">
                  10k+
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Active Users
                </div>
              </Card>
              <Card className="border-zinc-200 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-800">
                <div className="mb-2 text-4xl font-bold text-purple-600 dark:text-purple-400">
                  50+
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Companies Trust Us
                </div>
              </Card>
              <Card className="border-zinc-200 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-800">
                <div className="mb-2 text-4xl font-bold text-amber-600 dark:text-amber-400">
                  24/7
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Customer Support
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-linear-to-br from-blue-600 to-indigo-700 px-6 py-20 dark:from-blue-900 dark:to-indigo-900">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            Ready to Transform Your Construction Business?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-300">
            Join thousands of organizations already using Echno to streamline
            their construction management.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              onClick={() => signIn('keycloak')}
              size="lg"
              className="bg-white px-8 py-3 text-lg text-blue-700 hover:bg-zinc-100"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/70 bg-transparent px-8 py-3 text-lg text-white hover:bg-white/10 hover:text-white"
              onClick={() => router.push('/contact')}
            >
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white px-4 py-12 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Image
                src="/e-ai-logo.png"
                alt="Echno Logo"
                width={100}
                height={40}
                className="mb-4 dark:invert"
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Modern construction business management for the future.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => router.push('/features')}
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/pricing')}
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/contact#demo')}
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Request Demo
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
                Company
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => router.push('/about')}
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/contact')}
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
                Support
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-8 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              © {currentYear} Echno. All rights reserved.
            </p>
          </div>
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
