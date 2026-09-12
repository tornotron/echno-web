import { ModuleGuard } from '@/components/providers/module-guard';

export default function InspectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleGuard moduleId="inspections">{children}</ModuleGuard>;
}
