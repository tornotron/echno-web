import { requireSuperAdmin, forbiddenResponse } from '@/lib/rbac/server-auth';
import { NextRequest, NextResponse } from 'next/server';
import { normalizeRolesWithMapping } from '@/lib/rbac/role-normalizer';

/**
 * GET /api/admin/users
 * Get all users (super admin only)
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();

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
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Normalize role names from backend (hyphenated) to app format (camelCase)
    if (Array.isArray(data)) {
      for (const user of data) {
        if (user.roles && Array.isArray(user.roles)) {
          user.roles = normalizeRolesWithMapping(user.roles);
        }
      }
    } else if (data.users && Array.isArray(data.users)) {
      // Handle paginated response
      for (const user of data.users as Array<{ roles?: string[] }>) {
        if (user.roles && Array.isArray(user.roles)) {
          user.roles = normalizeRolesWithMapping(user.roles);
        }
      }
    }

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
