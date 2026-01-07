import { AppLayout } from '@/components/common/app-layout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
