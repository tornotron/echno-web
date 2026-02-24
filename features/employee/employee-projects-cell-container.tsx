'use client';

import { useProjectsByEmployee } from '@/hooks/project';
import { EmployeeProjectsCell } from '@/components/workforce/employee-projects-cell';

interface EmployeeProjectsCellContainerProps {
  employeeId: number;
}

/**
 * Container component that fetches employee projects data and renders EmployeeProjectsCell.
 * This component handles the data fetching logic.
 */
export function EmployeeProjectsCellContainer({
  employeeId,
}: EmployeeProjectsCellContainerProps) {
  const { data: projects, isLoading } = useProjectsByEmployee(employeeId);

  return <EmployeeProjectsCell projects={projects} isLoading={isLoading} />;
}
