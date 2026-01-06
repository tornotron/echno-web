import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export interface DemoFormData {
  name: string;
  email: string;
  company: string;
  teamSize: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DemoFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.company) {
      return NextResponse.json(
        { error: 'Name, email, and company are required' },
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

    // Log the demo request
    logger.info('Demo request received', {
      name: body.name,
      email: body.email,
      company: body.company,
      teamSize: body.teamSize,
    });

    // TODO: Integrate with CRM (HubSpot, Salesforce, etc.) or calendar booking
    // Example:
    // await createLead({
    //   name: body.name,
    //   email: body.email,
    //   company: body.company,
    //   teamSize: body.teamSize,
    //   type: 'demo_request',
    // });

    return NextResponse.json(
      { success: true, message: 'Demo request submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Demo request submission failed', { error });
    return NextResponse.json(
      { error: 'Failed to submit demo request' },
      { status: 500 }
    );
  }
}
