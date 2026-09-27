'use client';

import Link from 'next/link';
import { Truck } from 'lucide-react';
import { routes } from '@/nav';
import type { Asset } from '@/types/resource';

/**
 * Says that an asset is on its way to another site, and on which transfer.
 *
 * While an asset is in transit its project and location still read as the
 * sending site, because the move is recorded when the receiving site confirms
 * it arrived. Without this notice the page would show the asset sitting at a
 * site it has already left.
 *
 * @param props.asset - The asset being shown. Renders nothing when it is not in transit.
 */
export function AssetInTransitNotice({ asset }: { asset: Asset }) {
  if (!asset.inTransitSiteTransferId) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
    >
      <Truck className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>
        In transit on site transfer{' '}
        <Link
          href={
            routes.resources.transfers.detail(asset.inTransitSiteTransferId)
              .href
          }
          className="font-medium underline underline-offset-4"
        >
          {asset.inTransitSiteTransferNumber ??
            `#${asset.inTransitSiteTransferId}`}
        </Link>
        . It shows at the sending site until the receiving site records it
        arriving, and it cannot be moved any other way until then.
      </span>
    </div>
  );
}
