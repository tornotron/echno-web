import { ModuleGuard } from '@/components/providers/module-guard';

export default function ToolboxTalksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleGuard moduleId="toolbox-talks">{children}</ModuleGuard>;
}
