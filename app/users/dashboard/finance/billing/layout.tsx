import { ModuleGuard } from '@/components/providers/module-guard';

/** Contract billing belongs to the Work Progress module (`MODULE_WORK_PROGRESS`). */
export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleGuard moduleId="work-progress">{children}</ModuleGuard>;
}
