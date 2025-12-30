import { requireSuperAdmin, forbiddenResponse } from '@/lib/rbac/server-auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  denormalizeRoles,
  normalizeRolesWithMapping,
} from '@/lib/rbac/role-normalizer';

/**
 * GET /api/admin/users/[userId]/roles
 * Get user's roles
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

    // Fetch user roles from your backend API
    const response = await fetch(`${apiUrl}/users/${userId}/roles`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user roles' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Normalize role names from backend (hyphenated) to app format (camelCase)
    if (data.roles && Array.isArray(data.roles)) {
      data.roles = normalizeRolesWithMapping(data.roles);
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

/**
 * POST /api/admin/users/[userId]/roles
 * Assign roles to user
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireSuperAdmin();
    const { userId } = await params;

    const body = await req.json();
    const { roleIds } = body;

    if (!Array.isArray(roleIds)) {
      return NextResponse.json(
        { error: 'roleIds must be an array' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Denormalize role IDs from app format (camelCase) to backend format (hyphenated)
    // e.g., "projectManager" → "project-manager", "super_admin" → "super-admin"
    const denormalizedRoleIds = denormalizeRoles(roleIds);

    // Call your backend API to assign roles
    const response = await fetch(`${apiUrl}/users/${userId}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roleIds: denormalizedRoleIds,
        assignedBy: session.user.id,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || 'Failed to assign roles' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${roleIds.length} role(s)`,
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
 * DELETE /api/admin/users/[userId]/roles
 * Remove roles from user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { userId } = await params;

    const body = await req.json();
    const { roleIds } = body;

    if (!Array.isArray(roleIds)) {
      return NextResponse.json(
        { error: 'roleIds must be an array' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Denormalize role IDs from app format (camelCase) to backend format (hyphenated)
    const denormalizedRoleIds = denormalizeRoles(roleIds);

    // Call your backend API to remove roles
    const response = await fetch(`${apiUrl}/users/${userId}/roles`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roleIds: denormalizedRoleIds }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || 'Failed to remove roles' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${roleIds.length} role(s)`,
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
