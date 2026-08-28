'use client';

import Link from 'next/link';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/shadcn/sheet';
import { routes } from '@/nav';
import type { NcrDefect } from '@/types/inspection';
import { NcrDetail } from './ncr-detail';

interface NcrDetailSheetProps {
  /** The row being triaged; `undefined` closes the sheet. */
  defect?: NcrDefect;
  onOpenChange: (open: boolean) => void;
}

/**
 * Triage surface: opens over the NCR list so several can be worked through
 * without navigating. The body is the same component the full route renders,
 * and a button escalates to that route when there is more to do.
 */
export function NcrDetailSheet({ defect, onOpenChange }: NcrDetailSheetProps) {
  return (
    <Sheet open={Boolean(defect)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
        {defect && (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="pr-8">{defect.title}</SheetTitle>
              <SheetDescription>
                {defect.projectName ?? `Project #${defect.projectId}`}
              </SheetDescription>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-2 w-fit"
              >
                <Link href={routes.inspections.ncr.detail(defect.id).href}>
                  <Maximize2 className="size-4" />
                  Open Full Page
                </Link>
              </Button>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-9.5rem)]">
              <div className="p-4">
                <NcrDetail ncrId={defect.id} />
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
