"use client"

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { AuthButton } from "@/components/common/auth-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/styles/toast-styles";

function HomeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    // Check if user just logged out
    if (searchParams.get('logout') === 'success') {
      toast.success("Signed out successfully", {
        description: "You have been logged out.",
      });
      // Clean up the URL parameter
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100 mx-auto"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-900 dark:to-black">
      {/* Navigation */}
      <nav className="relative z-10 px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Image
              src="/echno.png"
              alt="Echno Logo"
              width={32}
              height={32}
              className="dark:invert"
            />
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Echno</span>
          </div>
          <AuthButton />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Image
              src="/echno.png"
              alt="Echno Logo"
              width={80}
              height={80}
              className="dark:invert"
            />
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-6">
            Modern
            <span className="block bg-gradient-to-r from-zinc-600 to-zinc-900 dark:from-zinc-400 dark:to-zinc-100 bg-clip-text text-transparent">
              Attendance Management
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
            Streamline your organization's attendance tracking with our comprehensive system.
            Real-time monitoring, automated reporting, and seamless employee management.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              onClick={() => router.push("/login")}
              size="lg"
              className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-black px-8 py-3 text-lg"
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-8 py-3 text-lg"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-zinc-300 dark:bg-zinc-700 rounded-full opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-zinc-400 dark:bg-zinc-600 rounded-full opacity-25 animate-pulse delay-500"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Everything you need for attendance management
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Powerful features designed to simplify attendance tracking and improve workplace efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">Real-time Tracking</CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Monitor attendance in real-time with instant updates and notifications.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">Advanced Analytics</CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Generate comprehensive reports and insights to optimize workforce management.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">Secure & Reliable</CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Enterprise-grade security with Keycloak authentication and data protection.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">99.9%</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">10k+</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">24/7</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Support</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">50+</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Companies</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-zinc-900 dark:bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to transform your attendance management?
          </h2>
          <p className="text-lg text-zinc-300 mb-8 max-w-2xl mx-auto">
            Join thousands of organizations already using Echno to streamline their workforce management.
          </p>
          <Button
            onClick={() => router.push("/login")}
            size="lg"
            className="bg-white text-zinc-900 hover:bg-zinc-100 px-8 py-3 text-lg"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Image
              src="/echno.png"
              alt="Echno Logo"
              width={24}
              height={24}
              className="dark:invert"
            />
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Echno</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            © {currentYear} Echno. Modern attendance management for the future.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100 mx-auto"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
