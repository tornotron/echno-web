import { requireSuperAdmin, forbiddenResponse } from '@/lib/rbac/server-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/users
 * Get all users (super admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSuperAdmin();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    const search = searchParams.get('search') || '';

    // Build query string
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
    });

    // Fetch all users from your backend API
    const response = await fetch(`${apiUrl}/users?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(session.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return forbiddenResponse(error.message);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
