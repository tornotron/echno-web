import { redirect } from 'next/navigation';

/**
 * Admin Root Page
 *
 * Redirects /admin to /admin/access-control
 * System admins can access admin-only features here
 */
export default function AdminPage() {
  redirect('/admin/access-control/users');
}
