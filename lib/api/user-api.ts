/**
 * User API Service
 * Handles all user-related API calls through the BFF layer
 */

import { User, parseUser } from '@/types/user/user';
import { parseErrorResponse, getUserFriendlyMessage } from '@/lib/utils/api-utils';

/**
 * Fetches the current user's profile from the BFF
 * This should be called from server components for static rendering
 */
const backendUrl = process.env.NEXT_PUBLIC_API_URL;

export async function fetchUserProfile(accessToken?: string): Promise<User> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${backendUrl}/user`, {
    method: 'GET',
    headers,
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const errorResponse = await parseErrorResponse(response);
    throw new Error(getUserFriendlyMessage(errorResponse));
  }

  const data = await response.json();
  return parseUser(data);
}

/**
 * Fetches user profile directly from backend (Server-side only)
 * Use this in server components when you have the access token
 */
export async function fetchUserProfileFromBackend(accessToken: string): Promise<User> {
  const endpoint = `${backendUrl}/user`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const errorResponse = await parseErrorResponse(response);
    throw new Error(getUserFriendlyMessage(errorResponse));
  }

  const data = await response.json();
  return parseUser(data);
}

/**
 * Updates user profile
 */
export async function updateUserProfile(updates: Partial<User>): Promise<User> {
  const response = await fetch('/api/user', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorResponse = await parseErrorResponse(response);
    throw new Error(getUserFriendlyMessage(errorResponse));
  }

  const data = await response.json();
  return parseUser(data);
}

/**
 * Updates user profile directly on backend (Server-side only)
 * Use this in server components when you have the access token
 */
export async function updateUserProfileOnBackend(
  accessToken: string,
  updates: Partial<User>
): Promise<User> {
  const endpoint = `${backendUrl}/user`;

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorResponse = await parseErrorResponse(response);
    throw new Error(getUserFriendlyMessage(errorResponse));
  }

  const data = await response.json();
  return parseUser(data);
}

/**
 * Client-side hook for fetching user profile
 * Use this only in client components when needed
 */
export async function getUserProfileClient(): Promise<User> {
  const response = await fetch('/api/user', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorResponse = await parseErrorResponse(response);
    throw new Error(getUserFriendlyMessage(errorResponse));
  }

  const data = await response.json();
  return parseUser(data);
}
