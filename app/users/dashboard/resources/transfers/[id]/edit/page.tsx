'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { routes } from '@/nav';

export default function EditTransferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Site transfers are immutable once created (only status can be updated from the detail page).
    router.replace(routes.resources.transfers.detail(id).href);
  }, [id, router]);

  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
    </div>
  );
}
