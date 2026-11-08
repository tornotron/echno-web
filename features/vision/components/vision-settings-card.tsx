'use client';

import { useRouter } from 'next/navigation';
import { ScanEye } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { useAuthorization } from '@/hooks/use-authorization';
import { routes } from '@/nav';
import { useVisionEnabled } from '@/hooks/use-vision-enabled';

export const VISION_SETTINGS_PATH = routes.settings.vision;

/**
 * The computer vision entry on the settings page: rendered only when the
 * organization has the `vision` module and the reader is its system admin,
 * the one role that can save those settings.
 */
export function VisionSettingsCard() {
  const router = useRouter();
  const visionEnabled = useVisionEnabled();
  const { isSystemAdmin, isLoading } = useAuthorization();
  if (!visionEnabled || isLoading || !isSystemAdmin) return null;

  return (
    <Card data-testid="vision-settings-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ScanEye className="h-5 w-5" />
          <CardTitle>Computer vision</CardTitle>
        </div>
        <CardDescription>
          Automatic inference on new evidence images, and which model families
          run
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          onClick={() => router.push(VISION_SETTINGS_PATH)}
        >
          Manage computer vision
        </Button>
      </CardContent>
    </Card>
  );
}
