'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useAuthorization } from '@/hooks/use-authorization';

/**
 * @deprecated Use /admin/access-control instead
 * This page redirects to the new access control dashboard
 */
export default function AdminUsersPage() {
  const { isLoading } = useAuthorization();

  // Redirect to new access control page
  useEffect(() => {
    if (!isLoading) {
      redirect('/admin/access-control');
    }
  }, [isLoading]);

  return null; // Will redirect
}
