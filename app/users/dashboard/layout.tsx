import { AppLayout } from '@/features/common/components/app-layout';
import { ChatStreamProvider } from '@/features/chat/components/chat-stream-provider';
import { FloatingChatSlot } from './floating-chat-slot';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The chat stream is opened here, once, rather than inside the chat feature: the floating
  // chat is present on every dashboard page, so the connection has to outlive navigation
  // between them.
  return (
    <ChatStreamProvider>
      <AppLayout floatingChat={<FloatingChatSlot />}>{children}</AppLayout>
    </ChatStreamProvider>
  );
}
