import { MessagesSquare } from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const chatMetadata = {
  chat: {
    label: 'Chat',
    icon: MessagesSquare,
    section: 'overview',
    order: 2,
  },
  'chat-[roomId]': {
    label: 'Chat Room',
    sidebarHidden: true,
  },
} satisfies MetadataRegistry;
