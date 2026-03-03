'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Maximize2, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FloatingChatRoomList } from './floating-chat-room-list';
import { FloatingChatRoomView } from './floating-chat-room-view';

// ── Drag hook ────────────────────────────────────────────────────────

interface Position {
  x: number;
  y: number;
}

/**
 * Generic hook that makes an element draggable via a handle.
 * Returns a ref for the drag handle and current position.
 * Position is stored as (right, bottom) offsets from viewport edges.
 */
function useDraggable(initial: Position) {
  const [pos, setPos] = useState<Position>(initial);
  const dragging = useRef(false);
  const dragStart = useRef<Position>({ x: 0, y: 0 });
  const posStart = useRef<Position>(initial);
  /** Whether the current gesture was a drag (moved > 4px) — used to suppress click */
  const wasDrag = useRef(false);
  /** Ref to the draggable element — used to read its actual size for clamping */
  const elementRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only primary button
      if (e.button !== 0) return;
      dragging.current = true;
      wasDrag.current = false;
      dragStart.current = { x: e.clientX, y: e.clientY };
      posStart.current = { ...pos };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [pos]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      wasDrag.current = true;
    }

    // We store as (right, bottom) so subtract delta (moving right = decreasing right-offset)
    const newX = Math.max(0, posStart.current.x - dx);
    const newY = Math.max(0, posStart.current.y - dy);
    setPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Read the element's actual size for accurate clamping
    const rect = elementRef.current?.getBoundingClientRect();
    const elWidth = rect?.width ?? 60;
    const elHeight = rect?.height ?? 60;

    // Clamp within viewport
    setPos((prev) => ({
      x: Math.max(0, Math.min(prev.x, window.innerWidth - elWidth)),
      y: Math.max(0, Math.min(prev.y, window.innerHeight - elHeight)),
    }));
  }, []);

  return {
    pos,
    setPos,
    wasDrag,
    elementRef,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  };
}

// ── Panel dimensions ─────────────────────────────────────────────────

const PANEL_W = 380;
const PANEL_H = 520;
const FAB_SIZE = 48;
const MARGIN = 24; // initial distance from edges

// ── Component ────────────────────────────────────────────────────────

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);

  // FAB position (right, bottom offsets)
  const fab = useDraggable({ x: MARGIN, y: MARGIN });

  // Panel position — anchored above the FAB initially
  const panel = useDraggable({
    x: MARGIN,
    y: MARGIN + FAB_SIZE + 8,
  });

  // When panel opens, position it above the current FAB location
  useEffect(() => {
    if (isOpen) {
      const panelBottom = fab.pos.y + FAB_SIZE + 8;
      // Clamp so panel doesn't go off-screen top
      const maxBottom = window.innerHeight - PANEL_H - 8;
      panel.setPos({
        x: Math.max(0, fab.pos.x + FAB_SIZE / 2 - PANEL_W / 2),
        y: Math.min(panelBottom, Math.max(maxBottom, 0)),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    globalThis.addEventListener('keydown', handleEsc);
    return () => globalThis.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  return (
    <TooltipProvider delayDuration={300}>
      {/* ── Floating Panel ─────────────────────────────────────── */}
      {isOpen && (
        <div
          ref={panel.elementRef}
          className="border-border/80 bg-background animate-in fade-in-0 slide-in-from-bottom-4 fixed z-50 flex flex-col overflow-hidden rounded-xl border text-[10px] shadow-[0_8px_40px_rgba(0,0,0,0.25)] ring-1 ring-black/10 duration-200 dark:ring-white/10"
          style={{
            width: PANEL_W,
            height: PANEL_H,
            right: panel.pos.x,
            bottom: panel.pos.y,
          }}
        >
          {/* Draggable header */}
          <div
            className="border-border flex h-9 shrink-0 cursor-grab items-center justify-between border-b bg-zinc-900 px-2 active:cursor-grabbing dark:bg-zinc-800"
            {...panel.handleProps}
          >
            <div className="pointer-events-none flex items-center gap-1 select-none">
              <GripVertical className="h-3 w-3 text-zinc-500" />
              <MessageCircle className="text-primary-foreground h-3 w-3" />
              <span className="text-[10px] font-semibold tracking-tight text-white">
                Chat
              </span>
            </div>

            {/* Buttons sit above the drag handle */}
            <div
              className="flex items-center gap-0.5"
              style={{ pointerEvents: 'auto' }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    asChild
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Link href="/users/dashboard/chat">
                      <Maximize2 className="h-3 w-3" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-[9px]">
                  Open full chat
                </TooltipContent>
              </Tooltip>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                onClick={() => setIsOpen(false)}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeRoomId ? (
              <FloatingChatRoomView
                roomId={activeRoomId}
                onBack={() => setActiveRoomId(null)}
              />
            ) : (
              <FloatingChatRoomList
                onSelectRoom={(id) => setActiveRoomId(id)}
              />
            )}
          </div>
        </div>
      )}

      {/* ── FAB Bubble (draggable) ─────────────────────────────── */}
      <div
        ref={fab.elementRef}
        className="fixed z-50"
        style={{
          right: fab.pos.x,
          bottom: fab.pos.y,
          width: FAB_SIZE,
          height: FAB_SIZE,
          touchAction: 'none',
        }}
        {...fab.handleProps}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                // Suppress click if the user was dragging
                if (fab.wasDrag.current) {
                  fab.wasDrag.current = false;
                  return;
                }
                setIsOpen((prev) => !prev);
              }}
              className="bg-primary text-primary-foreground flex h-full w-full cursor-grab items-center justify-center rounded-full shadow-lg transition-shadow hover:shadow-xl active:cursor-grabbing"
              aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <MessageCircle className="h-5 w-5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-[10px]">
            {isOpen ? 'Close chat' : 'Open chat'}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
