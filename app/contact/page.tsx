'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MarketingNav } from '@/features/home/components/marketing-nav';
import { MarketingFooter } from '@/features/home/components/marketing-footer';
import { useInView } from '@/hooks/use-in-view';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, inputVariants } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/index';

export default function ContactPage() {
  const { status } = useSession();
  const router = useRouter();
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    subject: 'general',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.push('/users/dashboard');
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Contact form failed:', data.error);
        return;
      }
      setSubmitted(true);
    } catch (error) {
      console.error('Contact form error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-500" />
      </div>
    );
  }

  const contactMethods = [
    {
      icon: Mail,
      label: 'Email Us',
      sub: 'Send us an email anytime',
      value: 'support@echnoai.com',
      accent: '#f59e0b',
    },
    {
      icon: Phone,
      label: 'Call Us',
      sub: 'Mon – Fri, 10am – 6pm IST',
      value: '+91 8590040842',
      accent: '#38bdf8',
    },
    {
      icon: MapPin,
      label: 'Location',
      sub: 'Based in India',
      value: 'Kerala, India',
      accent: '#34d399',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950">
      <MarketingNav currentPage="Contact" />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-36 pb-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] dark:hidden"
          style={{
            backgroundImage:
              'linear-gradient(rgba(30,27,75,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,27,75,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 hidden opacity-[0.03] dark:block"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,158,11,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-4 py-1.5 dark:border-amber-500/20 dark:bg-amber-500/6">
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Get in Touch
            </span>
          </div>
          <h1 className="mb-6 text-5xl leading-tight font-black text-zinc-900 sm:text-6xl dark:text-white">
            Let&apos;s Build
            <br />
            <span
              className="text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
            >
              Something Together.
            </span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Questions about Echno? Need a demo? Planning an enterprise rollout?
            Our team responds within one business day.
          </p>
        </div>
      </section>

      {/* Contact method cards */}
      <section className="border-t border-stone-200 bg-white px-6 py-16 dark:border-white/5 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-5 md:grid-cols-3">
            {contactMethods.map(({ icon: Icon, label, sub, value, accent }) => (
              <Card key={label} variant="contact-method">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                  }}
                  aria-hidden
                />
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    background: `${accent}12`,
                    border: `1px solid ${accent}28`,
                  }}
                >
                  <Icon className="h-6 w-6" style={{ color: accent }} />
                </div>
                <h3 className="mb-1 font-bold text-zinc-900 dark:text-zinc-100">
                  {label}
                </h3>
                <p className="mb-3 text-xs text-zinc-500">{sub}</p>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {value}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="bg-stone-50 px-6 py-24 dark:bg-zinc-950">
        <div ref={ref} className="mx-auto max-w-2xl">
          <div
            className={`mb-10 transition-all duration-700 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase dark:text-amber-500">
              Send a Message
            </div>
            <h2 className="text-3xl font-black text-zinc-900 sm:text-4xl dark:text-white">
              How can we help?
            </h2>
            <p className="mt-3 text-zinc-500">
              Fill out the form and we&apos;ll get back to you within 24 hours.
            </p>
          </div>

          {submitted ? (
            <Card
              variant="form"
              className={`items-center p-12 text-center transition-all delay-200 duration-700 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10">
                <CheckCircle2 className="h-8 w-8 text-amber-600 dark:text-amber-500" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
                Message Sent!
              </h3>
              <p className="text-sm text-zinc-500">
                Thank you for reaching out. We&apos;ll get back to you soon.
              </p>
            </Card>
          ) : (
            <Card
              variant="form"
              className={`transition-all delay-200 duration-700 ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Full Name *
                    </Label>
                    <Input
                      variant="marketing"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Email Address *
                    </Label>
                    <Input
                      variant="marketing"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="you@company.com"
                    />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Company
                    </Label>
                    <Input
                      variant="marketing"
                      type="text"
                      value={form.company}
                      onChange={(e) =>
                        setForm({ ...form, company: e.target.value })
                      }
                      placeholder="Your company"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Subject
                    </Label>
                    <select
                      value={form.subject}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                      className={cn(inputVariants({ variant: 'marketing' }))}
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
                  <Label className="mb-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Message *
                  </Label>
                  <Textarea
                    variant="marketing"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    placeholder="How can we help you?"
                  />
                </div>
                <Button
                  variant="gradient"
                  size="lg"
                  type="submit"
                  disabled={submitting}
                  className="group relative h-auto overflow-hidden px-8 py-3.5 font-bold"
                >
                  <span className="flex items-center gap-2">
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />{' '}
                        Sending…
                      </>
                    ) : (
                      <>
                        Send Message{' '}
                        <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </span>
                  <span
                    className="absolute inset-0 -translate-x-full skew-x-12 bg-white/20 transition-transform duration-500 group-hover:translate-x-full"
                    aria-hidden
                  />
                </Button>
              </form>
            </Card>
          )}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
