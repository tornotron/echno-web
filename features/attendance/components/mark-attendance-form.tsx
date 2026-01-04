'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, UserCheck, UserX, Calendar } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
interface Employee {
  id: string;
  name: string;
  employeeId: string;
  designation: string;
  currentStatus?: 'present' | 'absent' | 'not-marked';
  clockInTime?: string;
  clockOutTime?: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
}

export function MarkAttendanceForm() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set()
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [clockInTime, setClockInTime] = useState<string>('09:00');
  const [clockOutTime, setClockOutTime] = useState<string>('18:00');
  const [remarks, setRemarks] = useState<string>('');

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Load employees when project changes
  useEffect(() => {
    if (selectedProject) {
      fetchEmployeesByProject(selectedProject);
    }
  }, [selectedProject, selectedDate]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockProjects: Project[] = [
        { id: '1', name: 'Construction Site Alpha', code: 'CSA-001' },
        { id: '2', name: 'Building Project Beta', code: 'BPB-002' },
        { id: '3', name: 'Infrastructure Development', code: 'IFD-003' },
      ];
      setProjects(mockProjects);
    } catch (error) {
      logger.error('Failed to fetch projects', { error });
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesByProject = async (projectId: string) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockEmployees: Employee[] = [
        {
          id: '1',
          name: 'John Doe',
          employeeId: 'EMP-001',
          designation: 'Site Engineer',
          currentStatus: 'not-marked',
        },
        {
          id: '2',
          name: 'Jane Smith',
          employeeId: 'EMP-002',
          designation: 'Supervisor',
          currentStatus: 'not-marked',
        },
        {
          id: '3',
          name: 'Mike Johnson',
          employeeId: 'EMP-003',
          designation: 'Technician',
          currentStatus: 'present',
          clockInTime: '08:30',
          clockOutTime: '17:30',
        },
        {
          id: '4',
          name: 'Sarah Williams',
          employeeId: 'EMP-004',
          designation: 'Labor',
          currentStatus: 'not-marked',
        },
        {
          id: '5',
          name: 'Robert Brown',
          employeeId: 'EMP-005',
          designation: 'Foreman',
          currentStatus: 'absent',
        },
      ];
      setEmployees(mockEmployees);
      setSelectedEmployees(new Set());
    } catch (error) {
      logger.error('Failed to fetch employees', { error });
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = employees
        .filter((emp) => emp.currentStatus !== 'present')
        .map((emp) => emp.id);
      setSelectedEmployees(new Set(allIds));
    } else {
      setSelectedEmployees(new Set());
    }
  };

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    const newSelected = new Set(selectedEmployees);
    if (checked) {
      newSelected.add(employeeId);
    } else {
      newSelected.delete(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const handleMarkClockIn = async () => {
    if (selectedEmployees.size === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    try {
      setLoading(true);
      // TODO: Replace with actual API call
      logger.info('Marking clock-in for employees', {
        employees: [...selectedEmployees],
        project: selectedProject,
        date: selectedDate,
        time: clockInTime,
        remarks,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        `Clock-in marked for ${selectedEmployees.size} employee(s)`
      );

      // Refresh employee list
      if (selectedProject) {
        await fetchEmployeesByProject(selectedProject);
      }
      setRemarks('');
    } catch (error) {
      logger.error('Failed to mark clock-in', { error });
      toast.error('Failed to mark clock-in');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkClockOut = async () => {
    if (selectedEmployees.size === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    try {
      setLoading(true);
      // TODO: Replace with actual API call
      logger.info('Marking clock-out for employees', {
        employees: [...selectedEmployees],
        project: selectedProject,
        date: selectedDate,
        time: clockOutTime,
        remarks,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        `Clock-out marked for ${selectedEmployees.size} employee(s)`
      );

      // Refresh employee list
      if (selectedProject) {
        await fetchEmployeesByProject(selectedProject);
      }
      setRemarks('');
    } catch (error) {
      logger.error('Failed to mark clock-out', { error });
      toast.error('Failed to mark clock-out');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'present': {
        return <Badge className="bg-green-500">Present</Badge>;
      }
      case 'absent': {
        return <Badge variant="destructive">Absent</Badge>;
      }
      default: {
        return <Badge variant="secondary">Not Marked</Badge>;
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Employees</CardTitle>
          <CardDescription>
            Select project and date to view employees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
                disabled={loading}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <CardDescription>
              Select employees to mark attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          employees.length > 0 &&
                          selectedEmployees.size ===
                            employees.filter(
                              (emp) => emp.currentStatus !== 'present'
                            ).length
                        }
                        onCheckedChange={handleSelectAll}
                        disabled={
                          loading ||
                          employees.filter(
                            (emp) => emp.currentStatus !== 'present'
                          ).length === 0
                        }
                      />
                    </TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        {loading
                          ? 'Loading employees...'
                          : 'No employees found for this project'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((employee) => {
                      const isDisabled =
                        loading || employee.currentStatus === 'present';
                      return (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedEmployees.has(employee.id)}
                              onCheckedChange={(checked) =>
                                handleSelectEmployee(
                                  employee.id,
                                  checked as boolean
                                )
                              }
                              disabled={isDisabled}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {employee.employeeId}
                          </TableCell>
                          <TableCell>{employee.name}</TableCell>
                          <TableCell>{employee.designation}</TableCell>
                          <TableCell>
                            {getStatusBadge(employee.currentStatus)}
                          </TableCell>
                          <TableCell>{employee.clockInTime || '-'}</TableCell>
                          <TableCell>{employee.clockOutTime || '-'}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Actions */}
      {selectedProject && employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
            <CardDescription>
              Set clock-in/clock-out times and mark attendance for selected
              employees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clockInTime">Clock-In Time</Label>
                <Input
                  id="clockInTime"
                  type="time"
                  value={clockInTime}
                  onChange={(e) => setClockInTime(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clockOutTime">Clock-Out Time</Label>
                <Input
                  id="clockOutTime"
                  type="time"
                  value={clockOutTime}
                  onChange={(e) => setClockOutTime(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                placeholder="Add any notes or remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleMarkClockIn}
                disabled={loading || selectedEmployees.size === 0}
                className="flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Mark Clock-In ({selectedEmployees.size} selected)
              </Button>

              <Button
                onClick={handleMarkClockOut}
                disabled={loading || selectedEmployees.size === 0}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <UserX className="h-4 w-4" />
                Mark Clock-Out ({selectedEmployees.size} selected)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
