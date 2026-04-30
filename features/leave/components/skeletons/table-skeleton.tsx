import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Skeleton } from '@/components/shadcn/skeleton';

interface TableSkeletonProps {
  statCount?: number;
  rowCount?: number;
}

export function TableSkeleton({
  statCount = 4,
  rowCount = 5,
}: TableSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: statCount }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-8 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-0">
            {/* Header row */}
            <div className="flex gap-4 border-b p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
            {/* Data rows */}
            {Array.from({ length: rowCount }).map((_, i) => (
              <div key={i} className="flex gap-4 border-b p-4 last:border-0">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
