'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common';
import { FileEdit } from 'lucide-react';
import { useAttendanceRole, AttendanceRole } from '@/hooks/attendance';
import { AttendanceDashboardSwitcher } from '@/features/attendance/components/dashboard/attendance-dashboard-switcher';
import { RegularizationManagement } from '@/features/attendance/components/regularization-management';
import { EmployeeRegularizationView } from '@/features/attendance/components/employee-regularization-view';

const PREF_KEY = 'regularizations-dashboard-preference';

export default function RegularizationsPage() {
  const router = useRouter();
  const { availableRoles, isLoading } = useAttendanceRole();

  const [currentView, setCurrentView] = useState<AttendanceRole>(() => {
    if (globalThis.window === undefined) return AttendanceRole.EMPLOYEE;
    const saved = localStorage.getItem(PREF_KEY);
    if (
      saved &&
      Object.values(AttendanceRole).includes(saved as AttendanceRole)
    ) {
      return saved as AttendanceRole;
    }
    return AttendanceRole.EMPLOYEE;
  });

  // If the saved preference is a role the user no longer has, fall back to employee
  const activeView =
    !isLoading && !availableRoles.includes(currentView)
      ? AttendanceRole.EMPLOYEE
      : currentView;

  useEffect(() => {
    if (!isLoading && !availableRoles.includes(currentView)) {
      localStorage.setItem(PREF_KEY, AttendanceRole.EMPLOYEE);
    }
  }, [availableRoles, isLoading, currentView]);

  const handleViewChange = (newView: AttendanceRole) => {
    setCurrentView(newView);
    localStorage.setItem(PREF_KEY, newView);
  };

  if (isLoading) return null;

  const isManagerView =
    activeView === AttendanceRole.MANAGER ||
    activeView === AttendanceRole.ADMIN;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={isManagerView ? 'Regularization Requests' : 'My Regularizations'}
        description={
          isManagerView
            ? 'Review and manage pending attendance regularization requests'
            : 'Track the status of your regularization requests'
        }
        actions={
          <>
            {!isManagerView && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push('/users/dashboard/attendance/history')
                }
              >
                <FileEdit className="mr-2 h-4 w-4" />
                Request from History
              </Button>
            )}
            {availableRoles.length > 1 && (
              <AttendanceDashboardSwitcher
                currentRole={activeView}
                availableRoles={availableRoles}
                onRoleChange={handleViewChange}
              />
            )}
          </>
        }
      />

      {isManagerView ? (
        <RegularizationManagement hideHeader />
      ) : (
        <EmployeeRegularizationView hideHeader />
      )}
    </div>
  );
}
