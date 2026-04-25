'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { useChatRooms } from '@/hooks/chat/use-chat-rooms';
import { useUser } from '@/hooks/user/use-user';
import { useOrganizations } from '@/hooks/organization/use-organizations';

/**
 * /dashboard/chat — redirect to the first available room, or show empty state.
 */
export default function ChatIndexPage() {
  const router = useRouter();
  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useUser();
  const {
    data: organizations = [],
    isLoading: isOrgsLoading,
    isError: isOrgsError,
  } = useOrganizations();
  const currentOrg = organizations.find(
    (o) => o.id === user?.defaultOrganizationId
  );
  const {
    data: rooms = [],
    isLoading: isRoomsLoading,
    isError: isRoomsError,
  } = useChatRooms(currentOrg?.id);

  const isLoading = isUserLoading || isOrgsLoading || isRoomsLoading;
  const isError = isUserError || isOrgsError || isRoomsError;

  useEffect(() => {
    // On desktop (lg+, ≥1024px): auto-open the first room since the sidebar
    // is always visible and an empty right panel looks broken.
    // On mobile: stay on this page — the layout shows the room list full-screen
    // and the user taps a room to open it.
    const isDesktop =
      globalThis.window !== undefined && window.innerWidth >= 1024;
    if (!isLoading && !isError && rooms.length > 0 && isDesktop) {
      router.replace(`/users/dashboard/chat/${rooms[0].id}`);
    }
  }, [isLoading, isError, rooms, router]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertCircle className="text-destructive/60 h-12 w-12" />
        <div>
          <h3 className="text-base font-semibold">Something went wrong</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Could not load your conversations. Please try again later.
          </p>
        </div>
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
