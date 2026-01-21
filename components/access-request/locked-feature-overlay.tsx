'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Send } from 'lucide-react';
import { RequestAccessModal } from './request-access-modal';
import { AccessRequestType } from '@/types/access-request';

interface LockedFeatureOverlayProps {
  children: React.ReactNode;
  isLocked: boolean;
  featureName: string;
  moduleOrResource: string;
  description?: string;
  requestType?: AccessRequestType;
  resourceScope?: string;
  blur?: boolean;
}

export function LockedFeatureOverlay({
  children,
  isLocked,
  featureName,
  moduleOrResource,
  description,
  requestType = AccessRequestType.MODULE,
  resourceScope,
  blur = true,
}: LockedFeatureOverlayProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred/dimmed content */}
      <div
        className={`pointer-events-none select-none ${blur ? 'blur-sm' : 'opacity-50'}`}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80">
        <div className="mx-4 max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Lock className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Access Required
          </h3>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            You don&apos;t have permission to access {featureName}. Request
            access to unlock this feature.
          </p>
          <Button onClick={() => setModalOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            Request Access
          </Button>
        </div>
      </div>

      {/* Modal */}
      <RequestAccessModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        moduleOrResource={moduleOrResource}
        displayName={featureName}
        description={description}
        requestType={requestType}
        resourceScope={resourceScope}
      />
    </div>
  );
}
