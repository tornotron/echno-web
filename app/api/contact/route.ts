import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export interface ContactFormData {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Log the contact form submission
    logger.info('Contact form submission received', {
      name: body.name,
      email: body.email,
      company: body.company,
      subject: body.subject,
    });

    // TODO: Integrate with email service (SendGrid, Resend, etc.) or CRM
    // Example:
    // await sendEmail({
    //   to: 'support@echnoai.com',
    //   subject: `Contact Form: ${body.subject}`,
    //   body: `From: ${body.name} (${body.email})\nCompany: ${body.company}\n\n${body.message}`,
    // });

    return NextResponse.json(
      { success: true, message: 'Contact form submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Contact form submission failed', { error });
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
