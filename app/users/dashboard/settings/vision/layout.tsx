import { ModuleGuard } from '@/components/providers/module-guard';

export default function VisionSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleGuard moduleId="vision">{children}</ModuleGuard>;
}
