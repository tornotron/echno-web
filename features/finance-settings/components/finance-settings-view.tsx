'use client';

import { PostingAccountsPanel } from './posting-accounts-panel';
import { ApprovalThresholdPanel } from './approval-threshold-panel';

export function FinanceSettingsView() {
  return (
    <div className="space-y-6">
      <ApprovalThresholdPanel />
      <PostingAccountsPanel />
    </div>
  );
}
