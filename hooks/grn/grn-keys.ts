export const grnKeys = {
  all: ['grn'] as const,
  lists: () => [...grnKeys.all, 'list'] as const,
  detail: (id: number) => [...grnKeys.all, 'detail', id] as const,
  paginated: (pageNo: number, pageSize: number) =>
    [...grnKeys.all, 'paginated', { pageNo, pageSize }] as const,
  byVendor: (vendorId: number) => [...grnKeys.all, 'vendor', vendorId] as const,
  byDateRange: (startDate: string, endDate: string) =>
    [...grnKeys.all, 'date-range', startDate, endDate] as const,
};
