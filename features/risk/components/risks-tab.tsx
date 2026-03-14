'use client';

import { useState } from 'react';
import { RiskRegister, loadRisks } from './risk-register';

interface RisksTabProps {
  projectId: number;
}

export function RisksTab({ projectId }: RisksTabProps) {
  // Initialise directly from localStorage — no effect needed
  const [risks] = useState(() => loadRisks(projectId));

  return <RiskRegister projectId={projectId} initialRisks={risks} />;
}
