'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { useChatRooms } from '@/hooks/chat/use-chat-rooms';
import { useUser } from '@/hooks/user/use-user';
import { useOrganizations } from '@/hooks/organization/use-organizations';

/**
 * /dashboard/chat — redirect to the first available room, or show empty state.
 */
export default function ChatIndexPage() {
  const router = useRouter();
  const { data: user } = useUser();
  const { data: organizations = [] } = useOrganizations();
  const currentOrg = organizations.find(
    (o) => o.id === user?.defaultOrganizationId
  );
  const { data: rooms = [], isLoading } = useChatRooms(currentOrg?.id);

  useEffect(() => {
    if (!isLoading && rooms.length > 0) {
      router.replace(`/users/dashboard/chat/${rooms[0].id}`);
    }
  }, [isLoading, rooms, router]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <MessageSquare className="text-muted-foreground/40 h-12 w-12" />
        <div>
          <h3 className="text-base font-semibold">No conversations yet</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Start a direct message or join a project group to begin chatting.
          </p>
        </div>
      </div>
    );
  }

  // Redirecting — show nothing while navigation resolves
  return null;
}
