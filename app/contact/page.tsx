'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MarketingNav } from '@/features/home/components/marketing-nav';
import { MarketingFooter } from '@/features/home/components/marketing-footer';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Send, CheckCircle2, HardHat } from 'lucide-react';

export default function ContactPage() {
  const { status } = useSession();
  const router = useRouter();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    subject: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/users/dashboard');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Contact form submission failed:', data.error);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Contact form submission error:', error);
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500 dark:border-amber-500"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            {status === 'authenticated' ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <MarketingNav currentPage="Contact" />

      {/* Hero Section */}
      <section className="px-4 pt-32 pb-16">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-500">
            <HardHat className="mr-2 h-4 w-4" />
            Get in Touch
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
            We&apos;d Love to
            <span className="block text-indigo-600 dark:text-amber-500">
              Hear From You
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Have questions about our platform? Need help getting started? Our
            team is here to help.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 dark:bg-amber-500/10">
                <Mail className="h-6 w-6 text-indigo-600 dark:text-amber-500" />
              </div>
              <h3 className="mb-1 font-bold text-zinc-900 dark:text-zinc-100">
                Email Us
              </h3>
              <p className="mb-3 text-sm text-zinc-500">
                Send us an email anytime
              </p>
              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                support@echnoai.com
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 dark:bg-amber-500/10">
                <Phone className="h-6 w-6 text-indigo-600 dark:text-amber-500" />
              </div>
              <h3 className="mb-1 font-bold text-zinc-900 dark:text-zinc-100">
                Call Us
              </h3>
              <p className="mb-3 text-sm text-zinc-500">
                Monday to Friday, 10am - 6pm IST
              </p>
              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                +91 8590040842
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 dark:bg-amber-500/10">
                <MapPin className="h-6 w-6 text-indigo-600 dark:text-amber-500" />
              </div>
              <h3 className="mb-1 font-bold text-zinc-900 dark:text-zinc-100">
                Location
              </h3>
              <p className="mb-3 text-sm text-zinc-500">Based in India</p>
              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                Kerala, India
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Send Us a Message
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Fill out the form below and we&apos;ll get back to you within 24
              hours.
            </p>
          </div>

          {isSubmitted ? (
            <div className="rounded-lg border border-indigo-300 bg-indigo-50/50 p-8 text-center dark:border-amber-500/20 dark:bg-amber-500/5">
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-indigo-600 dark:text-amber-500" />
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Message Sent!
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Thank you for reaching out. We&apos;ll get back to you soon.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-lg border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) =>
                      setFormState({ ...formState, name: e.target.value })
                    }
                    placeholder="Your name"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none placeholder:text-zinc-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) =>
                      setFormState({ ...formState, email: e.target.value })
                    }
                    placeholder="you@company.com"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none placeholder:text-zinc-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formState.company}
                    onChange={(e) =>
                      setFormState({ ...formState, company: e.target.value })
                    }
                    placeholder="Your company"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none placeholder:text-zinc-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Subject
                  </label>
                  <select
                    value={formState.subject}
                    onChange={(e) =>
                      setFormState({ ...formState, subject: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-amber-500"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="sales">Sales</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formState.message}
                  onChange={(e) =>
                    setFormState({ ...formState, message: e.target.value })
                  }
                  placeholder="How can we help you?"
                  className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none placeholder:text-zinc-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:ring-amber-500"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-indigo-600 px-8 text-white hover:bg-indigo-500 sm:w-auto dark:bg-amber-600 dark:hover:bg-amber-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
