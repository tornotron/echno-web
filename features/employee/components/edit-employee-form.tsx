'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/shadcn/button';
import { SaveEmployeeDialog } from './employee-alert-dialogs';
import { useUpdateEmployee } from '@tornotron/echno-core/employee/hooks';
import { useShifts } from '@tornotron/echno-core/shift-timing/hooks';
import { toast } from '@/lib/styles/toast-styles';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Briefcase,
  Building2,
  DollarSign,
  Calendar,
  Save,
  X,
} from 'lucide-react';
import { routes } from '@/nav';
import {
  Department,
  getDepartmentLabel,
} from '@tornotron/echno-core/employee/types';
import {
  EmployeeStatus,
  getEmployeeStatusLabel,
} from '@tornotron/echno-core/employee/types';
import type { Employee } from '@tornotron/echno-core/employee/types';
import type { UpdateEmployeeRequest } from '@tornotron/echno-core/employee/types';

// Sentinel Select value for "no shift assigned" (shadcn Select forbids an
// empty-string item value).
const UNASSIGNED_SHIFT = 'unassigned';

// Helper to get initial form data from employee
const getInitialFormData = (emp: Employee | null | undefined) => ({
  // Professional Information
  employeeId: emp?.employeeId || '',
  designation: emp?.designation || '',
  department: emp?.department || '',
  // Employment Details
  joiningDate: emp?.joiningDate || null,
  status: emp?.status || '',
  salary: emp?.salary?.toString() || '',
  shiftTimingId: emp?.shiftTimingId == null ? '' : String(emp.shiftTimingId),
});

interface EditEmployeeFormProps {
  employee: Employee;
}

export function EditEmployeeForm({ employee }: EditEmployeeFormProps) {
  const router = useRouter();
  const updateEmployee = useUpdateEmployee();
  const { data: shifts = [] } = useShifts();

  // Form state - initialized with employee data
  const [formData, setFormData] = useState(() => getInitialFormData(employee));
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    id: number;
    data: UpdateEmployeeRequest;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build update payload matching the working Postman pattern
    // Only send employment detail fields, not professional info
    const updateData: UpdateEmployeeRequest = {};

    // Employment Details (matching Postman payload structure)
    if (formData.department) {
      updateData.department = formData.department as Department;
    }
    // Always send joiningDate so clearing it propagates to the server
    updateData.joiningDate = formData.joiningDate ?? null;
    // Always send salary so clearing it propagates to the server
    if (formData.salary) {
      const salaryValue = Number.parseFloat(formData.salary);
      updateData.salary = salaryValue;
    } else {
      updateData.salary = null;
    }
    // Always send shiftTimingId so clearing it propagates to the server
    updateData.shiftTimingId = formData.shiftTimingId
      ? Number(formData.shiftTimingId)
      : null;
    if (formData.status) {
      updateData.status = formData.status as EmployeeStatus;
    }

    // Professional info - add if provided
    if (formData.employeeId) {
      updateData.employeeId = formData.employeeId;
    }
    if (formData.designation) {
      updateData.designation = formData.designation;
    }

    setPendingUpdate({ id: employee.id, data: updateData });
    setShowConfirmUpdate(true);
  };

  const handleCancel = () => {
    router.push(
      routes.workforce.employees.employeeManagement.detail(employee.id).href
    );
  };

  return (
    <>
      <form key={employee.id} onSubmit={handleSubmit} className="space-y-6">
        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>Professional Information</span>
            </CardTitle>
            <CardDescription>
              Job-related details and qualifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employeeId">
                  Employee ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="employeeId"
                  placeholder="EMP-001"
                  value={formData.employeeId}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeId: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">
                  Designation <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Briefcase className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="designation"
                    placeholder="e.g., Senior Engineer"
                    className="pl-9"
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        designation: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      department: value as Department,
                    })
                  }
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Department).map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {getDepartmentLabel(dept)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Employment Details</span>
            </CardTitle>
            <CardDescription>
              Employment status, salary, and reporting structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="joiningDate">Joining Date</Label>
                <div className="relative">
                  <Calendar className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="joiningDate"
                    type="date"
                    className="pl-9"
                    value={
                      formData.joiningDate
                        ? formData.joiningDate.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        joiningDate: e.target.value
                          ? new Date(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Employment Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as EmployeeStatus,
                    })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EmployeeStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {getEmployeeStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Monthly Salary</Label>
                <div className="relative">
                  <DollarSign className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="salary"
                    type="number"
                    placeholder="e.g., 50000"
                    className="pl-9"
                    min="0"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shiftTiming">Shift Timing</Label>
                <Select
                  value={formData.shiftTimingId || UNASSIGNED_SHIFT}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      shiftTimingId: value === UNASSIGNED_SHIFT ? '' : value,
                    })
                  }
                >
                  <SelectTrigger id="shiftTiming">
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED_SHIFT}>Unassigned</SelectItem>
                    {shifts.map((shift) => (
                      <SelectItem key={shift.id} value={String(shift.id)}>
                        {shift.shiftName} ({shift.startTime} - {shift.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={updateEmployee.isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={updateEmployee.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateEmployee.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <SaveEmployeeDialog
        open={showConfirmUpdate}
        onOpenChange={(open) => {
          setShowConfirmUpdate(open);
          if (!open) setPendingUpdate(null);
        }}
        employeeName={employee.name}
        isPending={updateEmployee.isPending}
        onConfirm={() => {
          if (!pendingUpdate) return;
          updateEmployee.mutate(pendingUpdate, {
            onSuccess: (data) => {
              const displayName = data?.name || employee.name || 'Employee';
              toast.success('Employee Updated', {
                description: `${displayName}'s information has been updated.`,
              });
              router.push(
                routes.workforce.employees.employeeManagement.detail(
                  employee.id
                ).href
              );
            },
            onError: (error) => {
              toast.error('Failed to update employee', {
                description: error.message,
              });
            },
            onSettled: () => {
              setShowConfirmUpdate(false);
              setPendingUpdate(null);
            },
          });
        }}
      />
    </>
  );
}
