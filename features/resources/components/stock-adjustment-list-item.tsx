import Link from 'next/link';
import { routes } from '@/nav';
import { Badge } from '@/components/shadcn/badge';
import type { StockAdjustment } from '@/types/resource';

const getStatusBadgeColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    pending:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    approved:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    processed: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    cancelled: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  };
  return colors[status] ?? colors.draft;
};

const formatLabel = (value: string) =>
  value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

interface StockAdjustmentListItemProps {
  adjustment: StockAdjustment;
}

export function StockAdjustmentListItem({
  adjustment,
}: StockAdjustmentListItemProps) {
  return (
    <Link
      href={routes.resources.stockAdjustments.detail(adjustment.id).href}
      className="block"
    >
      <div className="rounded-lg border p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {adjustment.adjustmentNumber}
                  </span>
                  <Badge className={getStatusBadgeColor(adjustment.status)}>
                    {formatLabel(adjustment.status)}
                  </Badge>
                  <Badge variant="outline">
                    {formatLabel(adjustment.type)}
                  </Badge>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Material:{' '}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {adjustment.lineItems[0]?.description || 'N/A'}
                  </span>
                  {adjustment.lineItems.length > 1 && (
                    <span className="ml-2 text-xs text-zinc-500">
                      +{adjustment.lineItems.length - 1} more items
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div>
                <span className="text-zinc-500">Location ID:</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {adjustment.locationId ?? 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">System Qty:</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {adjustment.lineItems[0]?.systemQuantity ?? 0}{' '}
                  {adjustment.lineItems[0]?.unit ?? ''}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Physical Qty:</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {adjustment.lineItems[0]?.physicalQuantity ?? 0}{' '}
                  {adjustment.lineItems[0]?.unit ?? ''}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Total Variance:</span>
                <Badge
                  variant="outline"
                  className={
                    adjustment.totalVarianceQuantity > 0
                      ? 'text-green-600'
                      : adjustment.totalVarianceQuantity < 0
                        ? 'text-red-600'
                        : ''
                  }
                >
                  {adjustment.totalVarianceQuantity > 0 ? '+' : ''}
                  {adjustment.totalVarianceQuantity}
                </Badge>
              </div>
            </div>

            {adjustment.notes && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Note: {adjustment.notes}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 lg:items-end">
            <div className="text-right">
              <p className="text-sm text-zinc-500">Reason</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {formatLabel(adjustment.primaryReason)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
