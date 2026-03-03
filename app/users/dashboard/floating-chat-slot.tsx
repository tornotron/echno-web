'use client';

import { usePathname } from 'next/navigation';
import { FloatingChat } from '@/features/chat/components/floating';

/**
 * Renders FloatingChat on all dashboard pages except the full chat view.
 * Extracted here so the shared AppLayout component stays feature-agnostic.
 */
export function FloatingChatSlot() {
  const pathname = usePathname();

  if (pathname.startsWith('/users/dashboard/chat')) return null;

  return <FloatingChat />;
}
