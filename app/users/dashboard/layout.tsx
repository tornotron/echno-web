import { AppLayout } from '@/features/common/components/app-layout';
import { FloatingChatSlot } from './floating-chat-slot';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout floatingChat={<FloatingChatSlot />}>{children}</AppLayout>;
}
