'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  activeCvModelVersion,
  cvModelFamilyLabels,
} from '@tornotron/echno-core/vision/types';
import type { UpdateVisionSettingsRequest } from '@tornotron/echno-core/vision/types';
import {
  useUpdateVisionSettings,
  useVisionModels,
  useVisionSettings,
} from '@tornotron/echno-core/vision/hooks';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Label } from '@/components/shadcn/label';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Switch } from '@/components/shadcn/switch';
import { useAuthorization } from '@/hooks/use-authorization';
import { userFacingErrorMessage } from '@/lib/utils/api-utils';
import { useVisionEnabled } from '@/hooks/use-vision-enabled';

/** Shown to anyone but the organization's system admin. */
export const VISION_ADMIN_ONLY_MESSAGE =
  "Only your organization's system admin can change the computer vision settings.";

/**
 * Toggles `key` in the selection. An empty selection means "every family
 * that has an active version", so the list is kept as the admin ticks it
 * and never filled in on their behalf.
 */
export function toggleModelKey(keys: readonly string[], key: string): string[] {
  return keys.includes(key)
    ? keys.filter((item) => item !== key)
    : [...keys, key];
}

/**
 * The organization's computer vision settings: whether new evidence images
 * go for inference automatically, and which model families run on them.
 * The route sits behind `ModuleGuard` for `vision`; the fetches are also
 * held until the module is confirmed on and the reader is the system admin,
 * since nobody else can save the form.
 */
export function VisionSettingsView() {
  const visionEnabled = useVisionEnabled();
  const { isSystemAdmin, isLoading: authLoading } = useAuthorization();
  const canEdit = visionEnabled && isSystemAdmin;
  const settings = useVisionSettings({ enabled: canEdit });
  const models = useVisionModels({ enabled: canEdit });
  const update = useUpdateVisionSettings();
  const [draft, setDraft] = useState<UpdateVisionSettingsRequest | null>(null);

  if (authLoading || !visionEnabled) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (!isSystemAdmin) {
    return (
      <p
        className="text-muted-foreground text-sm"
        data-testid="vision-admin-only"
      >
        {VISION_ADMIN_ONLY_MESSAGE}
      </p>
    );
  }
  if (settings.isLoading || models.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (settings.isError || !settings.data) {
    return (
      <p className="text-destructive text-sm">
        The computer vision settings could not be loaded.
      </p>
    );
  }

  const current: UpdateVisionSettingsRequest = draft ?? {
    autoInfer: settings.data.autoInfer,
    modelKeys: settings.data.modelKeys,
  };
  const families = models.data ?? [];

  const save = async () => {
    try {
      await update.mutateAsync(current);
      setDraft(null);
      toast.success('Computer vision settings saved');
    } catch (error) {
      toast.error(
        userFacingErrorMessage(error, 'The settings could not be saved.')
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automatic inference</CardTitle>
          <CardDescription>
            When on, every new evidence image is sent to the models below, and
            what they find lands in the observation queue as pending for review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="vision-auto-infer"
              checked={current.autoInfer}
              onCheckedChange={(autoInfer) =>
                setDraft({ ...current, autoInfer })
              }
            />
            <Label htmlFor="vision-auto-infer">
              Run the models on new images
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model families</CardTitle>
          <CardDescription>
            Leave every family unticked to run all families that have an active
            version, including families added later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {families.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No models are registered yet.
            </p>
          ) : (
            families.map((model) => {
              const active = activeCvModelVersion(model);
              const id = `vision-model-${model.key}`;
              return (
                <div key={model.key} className="flex items-start gap-3">
                  <Checkbox
                    id={id}
                    checked={current.modelKeys.includes(model.key)}
                    onCheckedChange={() =>
                      setDraft({
                        ...current,
                        modelKeys: toggleModelKey(current.modelKeys, model.key),
                      })
                    }
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor={id}>{model.name}</Label>
                    <p className="text-muted-foreground text-xs">
                      {cvModelFamilyLabels[model.family]}
                      {' · '}
                      {active
                        ? `active version ${active.version}`
                        : 'no active version, so nothing runs for it yet'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {current.modelKeys.length === 0 && families.length > 0 && (
            <p className="text-xs" data-testid="vision-all-families">
              Every family with an active version will run.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={!draft || update.isPending}
          onClick={() => setDraft(null)}
        >
          Discard changes
        </Button>
        <Button disabled={!draft || update.isPending} onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}
