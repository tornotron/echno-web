'use client';

import { VisionSettingsView } from '@/features/vision';

export default function VisionSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Computer vision</h1>
        <p className="text-muted-foreground text-sm">
          How your organization&apos;s evidence images are checked by the
          detection models.
        </p>
      </div>
      <VisionSettingsView />
    </div>
  );
}
