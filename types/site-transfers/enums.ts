export enum SiteTransferStatus {
  pending = 'PENDING',
  partiallyTransferred = 'PARTIALLY_TRANSFERRED',
  completed = 'COMPLETED',
}

export const siteTransferStatusLabels: Record<SiteTransferStatus, string> = {
  [SiteTransferStatus.pending]: 'Pending',
  [SiteTransferStatus.partiallyTransferred]: 'Partially Transferred',
  [SiteTransferStatus.completed]: 'Completed',
};

export const siteTransferStatusBadgeColors: Record<SiteTransferStatus, string> =
  {
    [SiteTransferStatus.pending]:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    [SiteTransferStatus.partiallyTransferred]:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    [SiteTransferStatus.completed]:
      'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  };
