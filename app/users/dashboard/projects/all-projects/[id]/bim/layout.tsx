import { ModuleGuard } from '@/components/providers/module-guard';

export default function ProjectBimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleGuard moduleId="bim">{children}</ModuleGuard>;
}
