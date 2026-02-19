'use client';

import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useEmployees } from '@/hooks/employee';
import { useUpdateEmployee } from '@/hooks/employee/use-employee-mutations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Briefcase,
  Building2,
  DollarSign,
  Calendar,
  Save,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import { Department, getDepartmentLabel } from '@/types/employee/departments';
import {
  EmployeeStatus,
  getEmployeeStatusLabel,
} from '@/types/employee/employee-status';
import type { Employee } from '@/types/employee';

interface EditEmployeePageProps {
  params: Promise<{
    id: string;
  }>;
}

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
  shiftTiming: emp?.shiftTiming || '',
});

export default function EditEmployeePage({ params }: EditEmployeePageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const employeeId = Number.parseInt(resolvedParams.id);
  const { data: employees, isLoading, error } = useEmployees();
  const employee = employees?.find((e) => e.id === employeeId);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show error state
  if (error || !employee) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold">Employee Not Found</h2>
        <p className="mb-4 text-zinc-500">
          The employee with ID {employeeId} could not be found.
        </p>
        <Button
          onClick={() => router.push('/users/dashboard/workforce/employees')}
        >
          Back to Employees
        </Button>
      </div>
    );
  }

  return <EditEmployeeForm employee={employee} />;
}

// Separate component to handle the form - receives employee as prop
function EditEmployeeForm({ employee }: { employee: Employee }) {
  const router = useRouter();
  const updateEmployee = useUpdateEmployee();

  // Form state - initialized with employee data
  const [formData, setFormData] = useState(() => getInitialFormData(employee));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build update payload matching the working Postman pattern
    // Only send employment detail fields, not professional info
    const updateData: Partial<Employee> = {};

    // Employment Details (matching Postman payload structure)
    if (formData.department) {
      updateData.department = formData.department as Department;
    }
    if (formData.joiningDate) {
      updateData.joiningDate = formData.joiningDate;
    }
    if (formData.salary) {
      // Parse as float and ensure it's a decimal number
      const salaryValue = Number.parseFloat(formData.salary);
      // Force decimal precision to ensure Java treats it as Double
      updateData.salary = salaryValue;
    }
    if (formData.shiftTiming) {
      updateData.shiftTiming = formData.shiftTiming;
    }
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

    updateEmployee.mutate(
      {
        id: employee.id!,
        data: updateData,
      },
      {
        onSuccess: () => {
          router.push(`/users/dashboard/workforce/employees/${employee.id}`);
        },
      }
    );
  };

  const handleCancel = () => {
    router.push(`/users/dashboard/workforce/employees/${employee.id}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center space-x-4">
          {employee.profilePicture?.file ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
              <Image
                src={employee.profilePicture.file}
                alt={employee.name}
                fill
                className="object-cover"
                sizes="64px"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
              <User className="h-8 w-8 text-white" />
            </div>
          )}
          <div>
            <h1 className="mb-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Edit Employee
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Update {employee.name}&apos;s information
            </p>
          </div>
        </div>

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
                <div>
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

                <div>
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

                <div>
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
                <div>
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

                <div>
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

                <div>
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

                <div>
                  <Label htmlFor="shiftTiming">Shift Timing</Label>
                  <Select
                    value={formData.shiftTiming}
                    onValueChange={(value) =>
                      setFormData({ ...formData, shiftTiming: value })
                    }
                  >
                    <SelectTrigger id="shiftTiming">
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9:00 AM - 6:00 PM">
                        9:00 AM - 6:00 PM
                      </SelectItem>
                      <SelectItem value="10:00 AM - 7:00 PM">
                        10:00 AM - 7:00 PM
                      </SelectItem>
                      <SelectItem value="6:00 AM - 3:00 PM">
                        6:00 AM - 3:00 PM
                      </SelectItem>
                      <SelectItem value="2:00 PM - 11:00 PM">
                        2:00 PM - 11:00 PM
                      </SelectItem>
                      <SelectItem value="Flexible">Flexible</SelectItem>
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
      </div>
    </div>
  );
}
