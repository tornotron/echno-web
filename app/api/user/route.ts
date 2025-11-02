import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { parseUser } from '@/types/user/user';

/**
 * GET /api/user
 * BFF endpoint to fetch current user profile from Spring Boot backend
 * This acts as a proxy to add authentication and handle errors gracefully
 */
export async function GET(request: NextRequest) {
  try {
    // Get session with access token
    const session = await auth();

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No valid session found' },
        { status: 401 }
      );
    }

    // Fetch from Spring Boot backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    const endpoint = `${backendUrl}/user`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      // Don't cache user data - always fetch fresh
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          error: 'Backend Error', 
          message: `Failed to fetch user profile: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const userData = await response.json();
    
    // Parse and validate the user data
    const user = parseUser(userData);

    return NextResponse.json(user, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in user API route:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user
 * Update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No valid session found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    const endpoint = `${backendUrl}/user`;

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          error: 'Backend Error', 
          message: `Failed to update user profile: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const userData = await response.json();
    const user = parseUser(userData);

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}
