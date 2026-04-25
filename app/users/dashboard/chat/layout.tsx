'use client';

import { usePathname } from 'next/navigation';
import { ChatSidebar } from '@/features/chat/components/chat-sidebar';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // True when the user has opened a specific room (e.g. /chat/42)
  const isInRoom = /\/chat\/\d+/.test(pathname);

  return (
    /*
     * Negative margins cancel the parent <main>'s padding so the chat shell
     * sits flush against the sticky header.
     *
     * Height:
     *  - Mobile: subtract header (4rem) AND bottom-nav (4rem) = 8rem
     *  - lg+: only subtract header (4rem) — bottom nav is hidden on desktop
     */
    <div className="-m-3 flex h-[calc(100dvh-8rem)] overflow-hidden sm:-m-4 lg:-m-6 lg:h-[calc(100dvh-4rem)]">
      {/*
       * Room list panel
       * Mobile: full-width when at /chat index, hidden when inside a room
       * lg+: fixed 288px sidebar, always visible
       */}
      <div
        className={`flex h-full w-full flex-col lg:flex lg:w-72 lg:min-w-64 lg:shrink-0 ${isInRoom ? 'hidden' : 'flex'} `}
      >
        <ChatSidebar />
      </div>

      {/*
       * Active room panel
       * Mobile: full-width when in a room, hidden when at /chat index
       * lg+: fills remaining width, always visible
       */}
      <div
        className={`min-w-0 flex-1 flex-col overflow-hidden lg:flex ${isInRoom ? 'flex' : 'hidden'} `}
      >
        {children}
      </div>
    </div>
  );
}
