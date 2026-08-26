'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useChatStream } from '@/hooks/chat/use-chat-stream';

interface ChatStreamContextValue {
  /** Whether live delivery is currently working. Consumers poll faster when it is not. */
  connected: boolean;
}

const ChatStreamContext = createContext<ChatStreamContextValue>({
  connected: false,
});

/**
 * Holds the single chat event stream for the session.
 *
 * Mounted once, in the dashboard layout. Both the chat page and the floating chat read chat
 * data, and each of them renders several components that would each want live updates; a
 * connection per component would multiply open streams by the size of the UI. One connection
 * feeding the shared query cache serves all of them.
 */
export function ChatStreamProvider({ children }: { children: ReactNode }) {
  const { connected } = useChatStream();

  return (
    <ChatStreamContext.Provider value={{ connected }}>
      {children}
    </ChatStreamContext.Provider>
  );
}

/**
 * Whether the chat stream is live.
 *
 * Returns `false` outside the provider, which is the safe answer: a consumer that cannot know
 * falls back to the faster poll rather than assuming updates are arriving.
 */
export function useChatStreamStatus(): ChatStreamContextValue {
  return useContext(ChatStreamContext);
}
