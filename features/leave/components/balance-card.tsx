import type { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Progress } from '@/components/shadcn/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/shadcn/tooltip';
import { LeaveBalance } from '@/types/leave';
import { formatDayCount } from '@/features/leave/lib/leave-days';
import {
  leaveEntitlement,
  leaveUsedPercent,
} from '@/features/leave/lib/leave-balance-figures';
import { Calendar, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  balance: LeaveBalance;
  showTrends?: boolean;
  compact?: boolean;
}

/**
 * One leave type's balance.
 *
 * The five figures are kept distinct because they answer different questions:
 * the annual quota is what the policy grants for the year, accrued is how much
 * of it the employee has earned so far, used and pending are what has gone out
 * or is on its way out, and available is what is left. The card used to label
 * `openingBalance` as the quota, which is only what last year carried over and
 * is zero for anyone in their first year, which is where the "Quota 0" beside
 * a ten-day balance came from. It also added the carried-forward days to `openingBalance`,
 * which the backend sets to the same figure, counting them twice.
 */
export function BalanceCard({
  balance,
  showTrends = true,
  compact = false,
}: BalanceCardProps) {
  // What the year grants in total: the policy's quota plus anything carried in.
  const entitlement = leaveEntitlement(balance);
  const measurable = entitlement > 0;

  const usedPercentage = leaveUsedPercent(balance);
  const availablePercentage = measurable
    ? Math.min(100, (balance.availableBalance / entitlement) * 100)
    : 0;

  const totalAvailable = balance.availableBalance;

  // Status classification. With no entitlement configured there is nothing to be
  // a proportion of, so no health claim is made either way.
  const isDepleted = measurable && totalAvailable <= 0;
  const isLow =
    measurable && totalAvailable > 0 && totalAvailable < entitlement * 0.3;
  const isHealthy =
    measurable && !isDepleted && !isLow && totalAvailable >= entitlement * 0.3;

  // Trend calculation (mock - would need historical data in production)
  const isAccruing = balance.accrued > 0;
  const isDepleting = balance.used > balance.accrued && balance.used > 0;

  // Color coding based on status
  let statusColor = 'text-green-600';
  if (isDepleted) {
    statusColor = 'text-red-600';
  } else if (isLow) {
    statusColor = 'text-yellow-600';
  }

  let progressClassName = 'h-3 [&>[data-slot=progress-indicator]]:bg-green-500';
  if (isDepleted) {
    progressClassName = 'h-3 [&>[data-slot=progress-indicator]]:bg-red-500';
  } else if (isLow) {
    progressClassName = 'h-3 [&>[data-slot=progress-indicator]]:bg-yellow-500';
  }

  let compactProgressColor = '#22c55e';
  if (isDepleted) {
    compactProgressColor = '#ef4444';
  } else if (isLow) {
    compactProgressColor = '#eab308';
  }

  const borderClass = cn(
    isDepleted && 'border-red-200',
    isLow && 'border-yellow-200',
    isHealthy && 'border-green-200'
  );

  let trendIcon: ReactNode = null;
  if (showTrends) {
    if (isAccruing && !isDepleting) {
      trendIcon = (
        <TrendingUp className="h-3.5 w-3.5 shrink-0 text-green-600" />
      );
    } else if (isDepleting) {
      trendIcon = (
        <TrendingDown className="h-3.5 w-3.5 shrink-0 text-red-600" />
      );
    } else if (balance.used === 0) {
      trendIcon = (
        <Minus className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
      );
    }
  }

  if (compact) {
    return (
      <Card className={cn('transition-all', borderClass)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium">
                  {balance.leaveTypeName}
                </span>
                {trendIcon}
              </div>
              <Progress
                value={availablePercentage}
                className="h-1.5 [&>[data-slot=progress-indicator]]:bg-current"
                style={{ color: compactProgressColor }}
              />
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">
                  Accrued{' '}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {formatDayCount(balance.accrued)}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Used{' '}
                  <span className="font-medium text-red-600">
                    {formatDayCount(balance.used)}
                  </span>
                </span>
                {balance.pending > 0 && (
                  <span className="text-muted-foreground">
                    Pending{' '}
                    <span className="font-medium text-yellow-600">
                      {formatDayCount(balance.pending)}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className={cn('text-2xl leading-none font-bold', statusColor)}>
                {formatDayCount(totalAvailable)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {measurable
                  ? `of ${formatDayCount(entitlement)} days`
                  : 'days available'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('transition-all hover:shadow-md', borderClass)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium">
              {balance.leaveTypeName}
            </CardTitle>
            {showTrends && (
              <>
                {isAccruing && !isDepleting && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Balance is accruing</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {isDepleting && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Balance is depleting</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {!isAccruing && !isDepleting && balance.used === 0 && (
                  <Minus className="text-muted-foreground h-4 w-4" />
                )}
              </>
            )}
          </div>
          <Calendar className="text-muted-foreground h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Available Balance - Large Display */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Available</span>
            <div className="flex items-baseline gap-1">
              <span className={cn('text-3xl font-bold', statusColor)}>
                {formatDayCount(totalAvailable)}
              </span>
              {measurable && (
                <span className="text-muted-foreground text-sm">
                  of {formatDayCount(entitlement)}
                </span>
              )}
            </div>
          </div>

          {/* Visual Progress Bar */}
          {measurable && (
            <div className="space-y-1">
              <Progress
                value={availablePercentage}
                className={progressClassName}
              />
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>{availablePercentage.toFixed(0)}% available</span>
                <span>{usedPercentage.toFixed(0)}% used</span>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Breakdown. Entitlement, accrued and available answer different
            questions, so all three are shown rather than one standing in for another. */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help space-y-1">
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    Annual quota
                    <Info className="h-3 w-3" />
                  </p>
                  <p className="font-semibold">
                    {formatDayCount(balance.annualQuota)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Days this leave policy grants for the full year</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help space-y-1">
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    Accrued so far
                    <Info className="h-3 w-3" />
                  </p>
                  <p className="font-semibold text-green-600">
                    {formatDayCount(balance.accrued)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Days earned so far this year, out of the annual quota</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Used</p>
            <p className="font-semibold text-red-600">
              {formatDayCount(balance.used)}
            </p>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help space-y-1">
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    Pending
                    <Info className="h-3 w-3" />
                  </p>
                  <p className="font-semibold text-yellow-600">
                    {formatDayCount(balance.pending)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Days on requests awaiting approval. They are held back from</p>
                <p>what you can book, but are not counted as used yet.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* What is actually bookable right now, once pending requests are held back. */}
        {balance.pending > 0 && (
          <div className="flex items-center justify-between border-t pt-2 text-sm">
            <span className="text-muted-foreground">You can book</span>
            <span className="font-medium">
              {formatDayCount(balance.bookableBalance)} days
            </span>
          </div>
        )}

        {/* Carry Forward Badge */}
        {balance.carryForwardFromPrevious > 0 && (
          <Badge variant="secondary" className="w-full justify-center">
            <TrendingUp className="mr-1 h-3 w-3" />+
            {formatDayCount(balance.carryForwardFromPrevious)} carried forward
          </Badge>
        )}

        {/* Status Badges */}
        {isHealthy && (
          <Badge
            variant="outline"
            className="w-full justify-center border-green-600 text-green-600"
          >
            Healthy Balance
          </Badge>
        )}

        {isLow && (
          <Badge
            variant="outline"
            className="w-full justify-center border-yellow-600 text-yellow-600"
          >
            Low Balance - Plan Ahead
          </Badge>
        )}

        {isDepleted && (
          <Badge variant="destructive" className="w-full justify-center">
            Exhausted - No Leave Available
          </Badge>
        )}

        {/* Accrual Rate Info. Derived from the annual quota, which is what the
            entitlement is spread over, not from the carried-forward opening balance. */}
        {balance.annualQuota > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-muted-foreground flex cursor-help items-center justify-center gap-1 text-center text-xs">
                  <Info className="h-3 w-3" />
                  Accrual rate: {formatDayCount(balance.annualQuota / 12)}{' '}
                  days/month
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Average monthly leave accrual</p>
                <p className="text-muted-foreground text-xs">
                  Based on {formatDayCount(balance.annualQuota)} days annual
                  quota
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
