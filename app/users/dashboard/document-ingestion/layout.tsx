import { ModuleGuard } from '@/components/providers/module-guard';

export default function DocumentIngestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleGuard moduleId="document-ingestion">{children}</ModuleGuard>;
}
