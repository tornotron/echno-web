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
import { Calendar, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  balance: LeaveBalance;
  showTrends?: boolean;
  compact?: boolean;
}

export function BalanceCard({
  balance,
  showTrends = true,
  compact = false,
}: BalanceCardProps) {
  // Calculate percentages and metrics
  const totalQuota = balance.openingBalance + balance.carryForwardFromPrevious;
  const usedPercentage = totalQuota > 0 ? (balance.used / totalQuota) * 100 : 0;
  const availablePercentage =
    totalQuota > 0 ? (balance.availableBalance / totalQuota) * 100 : 0;

  const totalAvailable = balance.availableBalance;

  // Status classification
  const isHealthy = totalAvailable >= totalQuota * 0.5;
  const isLow = totalAvailable < totalQuota * 0.3 && totalAvailable > 0;
  const isDepleted = totalAvailable === 0;

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
                  Quota{' '}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {balance.openingBalance}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Used{' '}
                  <span className="font-medium text-red-600">
                    {balance.used}
                  </span>
                </span>
                {balance.pending > 0 && (
                  <span className="text-muted-foreground">
                    Pending{' '}
                    <span className="font-medium text-yellow-600">
                      {balance.pending}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className={cn('text-2xl leading-none font-bold', statusColor)}>
                {totalAvailable}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                / {totalQuota} days
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
                {totalAvailable}
              </span>
              <span className="text-muted-foreground text-sm">
                / {totalQuota}
              </span>
            </div>
          </div>

          {/* Visual Progress Bar */}
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
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help space-y-1">
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    Quota
                    <Info className="h-3 w-3" />
                  </p>
                  <p className="font-semibold">{balance.openingBalance}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Annual leave quota allocated</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Used</p>
            <p className="font-semibold text-red-600">{balance.used}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Pending</p>
            <p className="font-semibold text-yellow-600">{balance.pending}</p>
          </div>
        </div>

        {/* Accrued */}
        {balance.accrued > 0 && (
          <div className="flex items-center justify-between border-t pt-2 text-sm">
            <span className="text-muted-foreground">Accrued this period</span>
            <span className="font-medium text-green-600">
              +{balance.accrued}
            </span>
          </div>
        )}

        {/* Carry Forward Badge */}
        {balance.carryForwardFromPrevious > 0 && (
          <Badge variant="secondary" className="w-full justify-center">
            <TrendingUp className="mr-1 h-3 w-3" />+
            {balance.carryForwardFromPrevious} carried forward
          </Badge>
        )}

        {/* Status Badges */}
        {isHealthy && !isDepleted && !isLow && (
          <Badge
            variant="outline"
            className="w-full justify-center border-green-600 text-green-600"
          >
            Healthy Balance
          </Badge>
        )}

        {isLow && !isDepleted && (
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

        {/* Accrual Rate Info */}
        {balance.openingBalance > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-muted-foreground flex cursor-help items-center justify-center gap-1 text-center text-xs">
                  <Info className="h-3 w-3" />
                  Accrual rate: {(balance.openingBalance / 12).toFixed(2)}{' '}
                  days/month
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Average monthly leave accrual</p>
                <p className="text-muted-foreground text-xs">
                  Based on {balance.openingBalance} days annual quota
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
