import { requireSuperAdmin, forbiddenResponse } from '@/lib/rbac/server-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/users/[userId]
 * Get detailed user information (super admin only)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { userId } = await params;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Fetch user details from your backend API
    const response = await fetch(`${apiUrl}/users/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to fetch user' },
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

/**
 * PATCH /api/admin/users/[userId]
 * Update user information (super admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { userId } = await params;

    const body = await req.json();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Update user in your backend API
    const response = await fetch(`${apiUrl}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || 'Failed to update user' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Roles are now used directly from backend (no normalization needed)

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data,
    });
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

/**
 * DELETE /api/admin/users/[userId]
 * Delete user (super admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { userId } = await params;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Delete user from your backend API
    const response = await fetch(`${apiUrl}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || 'Failed to delete user' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
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
