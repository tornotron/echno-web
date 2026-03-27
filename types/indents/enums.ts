export enum IndentStatus {
  pending = 'PENDING',
  ordered = 'ORDERED',
  onSite = 'ON_SITE',
  delayed = 'DELAYED',
  cancelled = 'CANCELLED',
}

export const indentStatusLabels: Record<IndentStatus, string> = {
  [IndentStatus.pending]: 'Pending',
  [IndentStatus.ordered]: 'Ordered',
  [IndentStatus.onSite]: 'On Site',
  [IndentStatus.delayed]: 'Delayed',
  [IndentStatus.cancelled]: 'Cancelled',
};

export const indentStatusBadgeColors: Record<IndentStatus, string> = {
  [IndentStatus.pending]: 'bg-yellow-100 text-yellow-700',
  [IndentStatus.ordered]: 'bg-blue-100 text-blue-700',
  [IndentStatus.onSite]: 'bg-green-100 text-green-700',
  [IndentStatus.delayed]: 'bg-red-100 text-red-700',
  [IndentStatus.cancelled]: 'bg-zinc-100 text-zinc-700',
};
