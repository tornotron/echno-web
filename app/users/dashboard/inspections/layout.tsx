import { ModuleGuard } from '@/components/common/module-guard';

export default function InspectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleGuard moduleId="inspections">{children}</ModuleGuard>;
}
