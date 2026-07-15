// Attendance query/mutation hooks + key factory now live in echno-core
// (`@tornotron/echno-core/attendance/{hooks,hooks/keys}`). Only the web-side
// auth-binding role adapter stays here — it depends on next-auth via
// `useAuthorization()`, which is not part of echno-core. This file is permanent.
export * from './use-attendance-role';
