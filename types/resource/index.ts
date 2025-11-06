// New resource structure with location-based management
export * from './location';
export * from './inventory';
export * from './asset';

// Inventory management
export * from './purchase-order';
export * from './material-request';
export * from './transfer';
export * from './stock-adjustment';

// Legacy exports (to be deprecated)
export * from './resource-type';
export * from './resource-status';
// Note: resource.ts has naming conflicts with asset.ts, keep asset.ts as the source of truth
// export * from './resource';

