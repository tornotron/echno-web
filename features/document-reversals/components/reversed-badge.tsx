'use client';

/**
 * The "Reversed" mark on a document that has been undone, linking to the
 * approved request. Rendered from the document's own `reversalId`, so it
 * needs no second query and shows in lists as well as on the page.
 */
import Link from 'next/link';
import { Undo2 } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { routes } from '@/nav';

export function ReversedBadge({ reversalId }: { reversalId?: number }) {
  if (!reversalId) return null;
  return (
    <Link href={routes.resources.reversals.detail(reversalId).href}>
      <Badge className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400">
        <Undo2 className="mr-1 h-3 w-3" />
        Reversed
      </Badge>
    </Link>
  );
}
