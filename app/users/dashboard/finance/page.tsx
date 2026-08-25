import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { navById } from '@/nav';
import { PageHeader } from '@/components/common';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';

// Finance landing hub. The module cards are derived from the composed
// navigation tree so the labels, icons and ordering always match the sidebar
// and there is a single source of truth to maintain.
const financeModules = (navById.finance?.children ?? []).filter(
  (item) => !item.sidebarHidden && !item.isDynamic && !item.nonInteractive
);

export default function FinancePage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Finance"
        description="Manage receipts, payments, invoices, expenses, budgets and the ledger from one place."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {financeModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.id}
              href={module.path}
              className="group rounded-lg focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
            >
              <Card className="h-full gap-0 p-5 transition-colors group-hover:border-zinc-300 dark:group-hover:border-zinc-700">
                <CardHeader className="gap-2 p-0">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      {Icon && (
                        <Icon className="size-4 text-zinc-600 dark:text-zinc-400" />
                      )}
                    </div>
                    <ArrowRight className="size-4 text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400" />
                  </div>
                  <CardTitle className="text-base">{module.label}</CardTitle>
                  {module.description && (
                    <CardDescription>{module.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
