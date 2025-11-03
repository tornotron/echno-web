import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { parseUser } from '@/types/user/user';
import { createErrorResponse, parseErrorResponse } from '@/lib/utils/api-utils';

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
      const errorResponse = createErrorResponse(
        'Unauthorized',
        'No valid session found',
        {
          userMessage: 'Your session has expired. Please log in again.',
          statusCode: 401,
          path: request.nextUrl.pathname,
        }
      );
      return NextResponse.json(errorResponse, { status: 401 });
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
      const backendError = await parseErrorResponse(response);
      
      console.error('Backend API error:', {
        status: response.status,
        error: backendError,
      });
      
      return NextResponse.json(backendError, { status: response.status });
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
    
    const errorResponse = createErrorResponse(
      'Internal Server Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
      {
        userMessage: 'An unexpected error occurred while retrieving your profile. Please try again.',
        statusCode: 500,
        path: request.nextUrl.pathname,
      }
    );
    
    return NextResponse.json(errorResponse, { status: 500 });
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
      const errorResponse = createErrorResponse(
        'Unauthorized',
        'No valid session found',
        {
          userMessage: 'Your session has expired. Please log in again.',
          statusCode: 401,
          path: request.nextUrl.pathname,
        }
      );
      return NextResponse.json(errorResponse, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      const errorResponse = createErrorResponse(
        'Bad Request',
        'Invalid request body',
        {
          userMessage: 'Invalid profile data. Please check your input and try again.',
          statusCode: 400,
          path: request.nextUrl.pathname,
          details: parseError,
        }
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate that body is not empty
    if (!body || Object.keys(body).length === 0) {
      const errorResponse = createErrorResponse(
        'Bad Request',
        'No data provided for update',
        {
          userMessage: 'No profile changes were provided. Please update at least one field.',
          statusCode: 400,
          path: request.nextUrl.pathname,
        }
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

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
      const backendError = await parseErrorResponse(response);
      
      console.error('Backend API error during update:', {
        status: response.status,
        error: backendError,
        requestBody: body,
      });
      
      return NextResponse.json(backendError, { status: response.status });
    }

    const userData = await response.json();
    const user = parseUser(userData);

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    const errorResponse = createErrorResponse(
      'Internal Server Error',
      error instanceof Error ? error.message : 'An unexpected error occurred',
      {
        userMessage: 'An unexpected error occurred while updating your profile. Please try again.',
        statusCode: 500,
        path: request.nextUrl.pathname,
      }
    );
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
