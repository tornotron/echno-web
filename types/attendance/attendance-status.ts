// types/attendance/attendance-status.ts
// Attendance status enumeration

export enum AttendanceStatus {
  present = 'present',
  halfDay = 'halfDay',
  absent = 'absent',
  leave = 'leave',
  weeklyOff = 'weeklyOff',
  holiday = 'holiday',
  late = 'late',
  earlyCheckout = 'earlyCheckout',
  overtime = 'overtime',
  pendingRegularization = 'pendingRegularization',
}

export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  const labels: Record<AttendanceStatus, string> = {
    [AttendanceStatus.present]: 'Present',
    [AttendanceStatus.halfDay]: 'Half Day',
    [AttendanceStatus.absent]: 'Absent',
    [AttendanceStatus.leave]: 'On Leave',
    [AttendanceStatus.weeklyOff]: 'Weekly Off',
    [AttendanceStatus.holiday]: 'Holiday',
    [AttendanceStatus.late]: 'Late Arrival',
    [AttendanceStatus.earlyCheckout]: 'Early Checkout',
    [AttendanceStatus.overtime]: 'Overtime',
    [AttendanceStatus.pendingRegularization]: 'Pending Regularization',
  };
  return labels[status];
}

export function getAttendanceStatusColor(status: AttendanceStatus): string {
  const colors: Record<AttendanceStatus, string> = {
    [AttendanceStatus.present]: 'green',
    [AttendanceStatus.halfDay]: 'yellow',
    [AttendanceStatus.absent]: 'red',
    [AttendanceStatus.leave]: 'blue',
    [AttendanceStatus.weeklyOff]: 'gray',
    [AttendanceStatus.holiday]: 'purple',
    [AttendanceStatus.late]: 'orange',
    [AttendanceStatus.earlyCheckout]: 'orange',
    [AttendanceStatus.overtime]: 'teal',
    [AttendanceStatus.pendingRegularization]: 'amber',
  };
  return colors[status];
}

/**
 * Calculate attendance weight for salary calculation
 * 1.0 = Full day, 0.5 = Half day, 0.0 = Absent
 */
export function getAttendanceWeight(status: AttendanceStatus): number {
  const weights: Record<AttendanceStatus, number> = {
    [AttendanceStatus.present]: 1.0,
    [AttendanceStatus.halfDay]: 0.5,
    [AttendanceStatus.absent]: 0.0,
    [AttendanceStatus.leave]: 1.0, // Paid leave
    [AttendanceStatus.weeklyOff]: 1.0,
    [AttendanceStatus.holiday]: 1.0,
    [AttendanceStatus.late]: 0.9, // 10% deduction for late arrival
    [AttendanceStatus.earlyCheckout]: 0.9, // 10% deduction for early checkout
    [AttendanceStatus.overtime]: 1.5, // 1.5x for overtime
    [AttendanceStatus.pendingRegularization]: 0.0, // No pay until regularized
  };
  return weights[status];
}
