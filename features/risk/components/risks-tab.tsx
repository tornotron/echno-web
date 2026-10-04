'use client';

import { useRisks } from '@tornotron/echno-core/risk/hooks';
import { useCan } from '@/hooks/use-can';
import { PROJECT_WRITE_ACCESS } from '@/nav/access/roles';
import { RiskRegister } from './risk-register';
import { LocalRiskImport } from './local-risk-import';

interface RisksTabProps {
  projectId: number;
}

/**
 * The project's risk register, read from the server so everyone on the
 * project sees the same one. Recording and changing risks is the project
 * pair's (system-admin, project-manager), as on the backend.
 */
export function RisksTab({ projectId }: RisksTabProps) {
  const { allowed: canWrite } = useCan(PROJECT_WRITE_ACCESS);
  const { data: risks = [], isLoading } = useRisks(projectId);

  return (
    <div className="space-y-4">
      <LocalRiskImport projectId={projectId} canWrite={canWrite} />
      <RiskRegister
        projectId={projectId}
        risks={risks}
        canWrite={canWrite}
        isLoading={isLoading}
      />
    </div>
  );
}
