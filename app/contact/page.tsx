'use client';

import { useState, useEffect } from 'react';
import { MarketingNav } from '@/components/home/marketing-nav';
import { MarketingFooter } from '@/components/home/marketing-footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  Building2,
  Headphones,
  FileQuestion,
  Calendar,
  ArrowRight,
} from 'lucide-react';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Us',
    description: 'Send us an email anytime',
    primary: 'support@echnoai.com',
    secondary: 'sales@echnoai.com',
    color: 'blue',
  },
  {
    icon: Phone,
    title: 'Call Us',
    description: 'Mon-Fri from 9am to 6pm EST',
    primary: '+1 (555) 123-4567',
    secondary: '+1 (555) 987-6543',
    color: 'green',
  },
  {
    icon: MapPin,
    title: 'Visit Us',
    description: 'Come say hello at our office',
    primary: '123 Business Avenue',
    secondary: 'San Francisco, CA 94107',
    color: 'purple',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Chat with our support team',
    primary: 'Available 24/7',
    secondary: 'Average response: < 5 min',
    color: 'amber',
  },
];

const supportOptions = [
  {
    icon: Headphones,
    title: 'Technical Support',
    description: 'Get help with technical issues, bugs, or platform questions.',
    link: '#contact-form',
  },
  {
    icon: Building2,
    title: 'Enterprise Sales',
    description: 'Learn about our enterprise solutions and custom pricing.',
    link: '#contact-form',
  },
  {
    icon: FileQuestion,
    title: 'General Inquiries',
    description: "Have a question? We'd love to hear from you.",
    link: '#contact-form',
  },
];

const offices = [
  {
    city: 'San Francisco',
    country: 'United States',
    address: '123 Business Avenue, San Francisco, CA 94107',
    phone: '+1 (555) 123-4567',
  },
  {
    city: 'New York',
    country: 'United States',
    address: '456 Innovation Street, New York, NY 10001',
    phone: '+1 (555) 234-5678',
  },
  {
    city: 'London',
    country: 'United Kingdom',
    address: '789 Tech Lane, London, EC1A 1BB',
    phone: '+44 20 1234 5678',
  },
];

const colorClasses: Record<string, { bg: string; icon: string }> = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    icon: 'text-amber-600 dark:text-amber-400',
  },
};

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    subject: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Demo form data
  const [demoFormState, setDemoFormState] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '',
  });
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [isDemoSubmitted, setIsDemoSubmitted] = useState(false);

  // Scroll to demo section if hash is present
  useEffect(() => {
    if (
      globalThis.window !== undefined &&
      globalThis.location.hash === '#demo'
    ) {
      setTimeout(() => {
        const element = document.querySelector('#demo');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDemoSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsDemoSubmitting(false);
    setIsDemoSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-900 dark:to-black">
      <MarketingNav currentPage="Contact" />

      {/* Hero Section */}
      <section className="px-4 pt-32 pb-16">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <MessageSquare className="mr-2 h-4 w-4" />
            Get in Touch
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
            We&apos;d Love to
            <span className="block bg-linear-to-r from-amber-600 to-orange-600 bg-clip-text pb-1 text-transparent dark:from-amber-400 dark:to-orange-400">
              Hear From You
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Have questions about our platform? Need help getting started? Our
            team is here to help you succeed.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              const colors = colorClasses[method.color];
              return (
                <Card
                  key={method.title}
                  className="border-zinc-200 bg-white p-6 text-center transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div
                    className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${colors.bg}`}
                  >
                    <Icon className={`h-7 w-7 ${colors.icon}`} />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {method.title}
                  </h3>
                  <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                    {method.description}
                  </p>
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                    {method.primary}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {method.secondary}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="bg-zinc-50 px-4 py-16 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              How Can We Help?
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Choose the type of support you need.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {supportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <a key={option.title} href={option.link} className="block">
                  <Card className="h-full border-zinc-200 bg-white p-8 transition-all hover:scale-[1.02] hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                      <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {option.title}
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {option.description}
                    </p>
                  </Card>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Form */}
            <div>
              <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Send Us a Message
              </h2>
              <p className="mb-8 text-zinc-600 dark:text-zinc-400">
                Fill out the form below and we&apos;ll get back to you within 24
                hours.
              </p>

              {isSubmitted ? (
                <Card className="border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20">
                  <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-600 dark:text-green-400" />
                  <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    Message Sent!
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Thank you for reaching out. We&apos;ll get back to you soon.
                  </p>
                </Card>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
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
                        placeholder="John Doe"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
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
                        placeholder="john@company.com"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
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
                          setFormState({
                            ...formState,
                            company: e.target.value,
                          })
                        }
                        placeholder="Your Company"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Subject
                      </label>
                      <select
                        value={formState.subject}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            subject: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
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
                      className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-amber-600 px-8 text-white hover:bg-amber-700 sm:w-auto"
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

            {/* Office Locations */}
            <div>
              <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Our Offices
              </h2>
              <p className="mb-8 text-zinc-600 dark:text-zinc-400">
                Visit us at one of our global locations.
              </p>

              <div className="space-y-6">
                {offices.map((office) => (
                  <Card
                    key={office.city}
                    className="border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
                      {office.city}
                    </h3>
                    <p className="mb-3 text-sm text-amber-600 dark:text-amber-400">
                      {office.country}
                    </p>
                    <div className="mb-2 flex items-start space-x-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{office.address}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{office.phone}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Business Hours */}
              <Card className="mt-6 border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="mb-4 flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Business Hours
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Saturday</span>
                    <span>10:00 AM - 2:00 PM EST</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Request Demo Section */}
      <section
        id="demo"
        className="bg-linear-to-br from-amber-600 to-orange-700 px-4 py-24 dark:from-amber-900 dark:to-orange-900"
      >
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm">
            <Calendar className="mr-2 h-4 w-4" />
            Request a Demo
          </div>
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            See Echno in Action
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-amber-100">
            Schedule a personalized demo with our team and discover how Echno
            can transform your construction business operations.
          </p>

          {isDemoSubmitted ? (
            <Card className="mx-auto max-w-xl border-0 bg-white p-8 text-center dark:bg-zinc-800">
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-600 dark:text-green-400" />
              <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Demo Request Received!
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Our team will contact you within 24 hours to schedule your
                personalized demo.
              </p>
            </Card>
          ) : (
            <Card className="mx-auto max-w-xl border-0 bg-white p-8 text-left dark:bg-zinc-800">
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={demoFormState.name}
                    onChange={(e) =>
                      setDemoFormState({
                        ...demoFormState,
                        name: e.target.value,
                      })
                    }
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={demoFormState.email}
                    onChange={(e) =>
                      setDemoFormState({
                        ...demoFormState,
                        email: e.target.value,
                      })
                    }
                    placeholder="john@company.com"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={demoFormState.company}
                    onChange={(e) =>
                      setDemoFormState({
                        ...demoFormState,
                        company: e.target.value,
                      })
                    }
                    placeholder="Your Company"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Team Size *
                  </label>
                  <select
                    required
                    value={demoFormState.teamSize}
                    onChange={(e) =>
                      setDemoFormState({
                        ...demoFormState,
                        teamSize: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-amber-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                  >
                    <option value="">Select team size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="200+">200+ employees</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="mt-4 w-full bg-amber-600 py-3 text-white hover:bg-amber-700"
                  disabled={isDemoSubmitting}
                >
                  {isDemoSubmitting ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Schedule Demo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
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
