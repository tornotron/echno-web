import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface InvitationStatsProps {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
}

export function InvitationStats({
  total,
  pending,
  accepted,
  expired,
}: InvitationStatsProps) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total Invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {total}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Pending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {pending}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Accepted</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {accepted}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Expired</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <AlertCircle className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {expired}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
