'use client';

import { ChatSidebar } from '@/features/chat/components/chat-sidebar';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     * Negative margins cancel the parent <main>'s padding (p-3/p-4/p-6),
     * so the chat shell sits flush against the header.
     * h-[calc(100dvh-4rem)] = full viewport height minus the 4rem sticky header.
     * overflow-hidden prevents the page from scrolling — each panel scrolls on its own.
     */
    <div className="-m-3 flex h-[calc(100dvh-4rem)] overflow-hidden sm:-m-4 lg:-m-6">
      {/* Left: room list — search pinned top, list scrolls, New Message pinned bottom */}
      <div className="w-72 min-w-64 shrink-0">
        <ChatSidebar />
      </div>

      {/* Right: active room — header pinned top, messages scroll, composer pinned bottom */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
