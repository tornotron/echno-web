'use client';

import { usePathname } from 'next/navigation';
import { FloatingChat } from '@/features/chat/components/floating';
import { routes } from '@/nav';

export function FloatingChatSlot() {
  const pathname = usePathname();

  if (pathname.startsWith(routes.chat.href)) return null;

  return <FloatingChat />;
}
