'use client';

import { useState } from 'react';
import { AppLayout, Pagination } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calendar,
  Search,
  Download,
  UserCheck,
  Clock,
  Users,
  User,
  AlertCircle,
  TrendingUp,
  MapPin,
  Camera,
  CheckCircle,
  XCircle,
  Check,
  X,
  Route,
  Plus,
  Car,
  Home,
  Building,
  Package,
  Eye,
  GraduationCap,
  ClipboardCheck,
  ShoppingCart,
  MoreHorizontal,
  Briefcase,
  HandshakeIcon,
  Wrench,
  FileText,
} from 'lucide-react';
import { mockAttendance, mockProjects } from '@/components/shared/mock-data';
import {
  AttendanceStatus,
  getAttendanceStatusLabel,
  getAttendanceStatusColor,
  MovementType,
  getMovementTypeLabel,
  getMovementTypeIcon,
} from '@/types/attendance';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from '@/lib/styles/toast-styles';

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date('2025-01-13'));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedAttendance, setSelectedAttendance] = useState<number[]>([]);

  // Movement tracking dialog state
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);

  const [newMovement, setNewMovement] = useState({
    type: MovementType.siteTravel,
    fromLocation: '',
    toLocation: '',
    startTime: '',
    endTime: '',
    purpose: '',
    distanceKm: 0,
  });

  // Get attendance for selected date
  const dateAttendance = mockAttendance.filter(
    (att) => att.date.toDateString() === selectedDate.toDateString()
  );

  // Apply filters
  const filteredAttendance = dateAttendance.filter((att) => {
    const matchesSearch =
      att.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || att.status === statusFilter;
    const matchesProject =
      projectFilter === 'all' || att.projectId.toString() === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAttendance = filteredAttendance.slice(startIndex, endIndex);

  // Calculate statistics
  const stats = {
    total: dateAttendance.length,
    present: dateAttendance.filter(
      (a) =>
        a.status === AttendanceStatus.present ||
        a.status === AttendanceStatus.overtime
    ).length,
    absent: dateAttendance.filter((a) => a.status === AttendanceStatus.absent)
      .length,
    late: dateAttendance.filter((a) => a.status === AttendanceStatus.late)
      .length,
    halfDay: dateAttendance.filter((a) => a.status === AttendanceStatus.halfDay)
      .length,
    pending: dateAttendance.filter(
      (a) => a.status === AttendanceStatus.pendingRegularization
    ).length,
    avgWorkHours:
      dateAttendance.reduce((sum, a) => sum + (a.workDuration?.hours || 0), 0) /
        dateAttendance.length || 0,
  };

  const attendanceRate =
    dateAttendance.length > 0
      ? ((stats.present + stats.late + stats.halfDay * 0.5) / stats.total) * 100
      : 0;

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedAttendance.length === paginatedAttendance.length) {
      setSelectedAttendance([]);
    } else {
      setSelectedAttendance(paginatedAttendance.map((att) => att.id));
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedAttendance.includes(id)) {
      setSelectedAttendance(selectedAttendance.filter((attId) => attId !== id));
    } else {
      setSelectedAttendance([...selectedAttendance, id]);
    }
  };

  // Approval/Rejection handlers
  const handleApprove = (ids: number[]) => {
    // TODO: Implement API call to approve attendance
    console.log('Approving attendance:', ids);
    setSelectedAttendance([]);
  };

  const handleReject = (ids: number[]) => {
    // TODO: Implement API call to reject attendance
    console.log('Rejecting attendance:', ids);
    setSelectedAttendance([]);
  };

  const isAllSelected =
    paginatedAttendance.length > 0 &&
    selectedAttendance.length === paginatedAttendance.length;
  const isSomeSelected =
    selectedAttendance.length > 0 &&
    selectedAttendance.length < paginatedAttendance.length;

  return (
    <AppLayout>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Attendance Management
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Track employee attendance with geo-location and photo verification
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedAttendance.length > 0 && (
              <>
                <Button
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => handleApprove(selectedAttendance)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve ({selectedAttendance.length})
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleReject(selectedAttendance)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject ({selectedAttendance.length})
                </Button>
              </>
            )}
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Total Employees
                  </p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {stats.total}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Present Today
                  </p>
                  <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.present}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    {attendanceRate.toFixed(1)}% rate
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Late / Absent
                  </p>
                  <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.late + stats.absent}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    {stats.late} late, {stats.absent} absent
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Avg Work Hours
                  </p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {stats.avgWorkHours.toFixed(1)}h
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    {stats.pending} pending approval
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daily Attendance</CardTitle>
                <CardDescription>
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardDescription>
              </div>
              <Input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-48"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-zinc-400" />
                <Input
                  placeholder="Search by name or employee ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={AttendanceStatus.present}>
                    Present
                  </SelectItem>
                  <SelectItem value={AttendanceStatus.absent}>
                    Absent
                  </SelectItem>
                  <SelectItem value={AttendanceStatus.late}>Late</SelectItem>
                  <SelectItem value={AttendanceStatus.halfDay}>
                    Half Day
                  </SelectItem>
                  <SelectItem value={AttendanceStatus.overtime}>
                    Overtime
                  </SelectItem>
                  <SelectItem value={AttendanceStatus.pendingRegularization}>
                    Pending
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={projectFilter}
                onValueChange={(value) => {
                  setProjectFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {mockProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredAttendance.length)} of{' '}
            {filteredAttendance.length} attendance records
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Rows per page:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Attendance Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <AlertCircle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
                      <p className="text-zinc-600 dark:text-zinc-400">
                        No attendance records found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAttendance.map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedAttendance.includes(attendance.id)}
                          onChange={() => handleSelectOne(attendance.id)}
                          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {attendance.employeeName}
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-500">
                              {attendance.employeeId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {attendance.projectName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getAttendanceStatusColor(
                            attendance.status
                          )}
                        >
                          {getAttendanceStatusLabel(attendance.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {attendance.morningClockIn ? (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {format(
                                attendance.morningClockIn.timestamp,
                                'HH:mm'
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {attendance.eveningClockOut ? (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {format(
                                attendance.eveningClockOut.timestamp,
                                'HH:mm'
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {attendance.workDuration.hours}h{' '}
                            {attendance.workDuration.minutes}m
                          </span>
                        </div>
                        {attendance.isOvertime && (
                          <span className="text-xs text-teal-600 dark:text-teal-400">
                            +
                            {Math.floor(
                              attendance.workDuration.overtimeMinutes / 60
                            )}
                            h OT
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {attendance.morningClockIn?.isWithinGeofence ? (
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : attendance.morningClockIn ? (
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          ) : null}
                          {attendance.morningClockIn && (
                            <>
                              <MapPin className="h-4 w-4 text-zinc-400" />
                              <Camera className="h-4 w-4 text-zinc-400" />
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <TooltipProvider>
                            {attendance.status ===
                              AttendanceStatus.pendingRegularization && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20"
                                      onClick={() =>
                                        handleApprove([attendance.id])
                                      }
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Approve Attendance</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                                      onClick={() =>
                                        handleReject([attendance.id])
                                      }
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Reject Attendance</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setMovementDialogOpen(true);
                                  }}
                                  className="relative h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20"
                                >
                                  <Route className="h-4 w-4" />
                                  {attendance.movements &&
                                    attendance.movements.length > 0 && (
                                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                                        {attendance.movements.length}
                                      </span>
                                    )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  View Movements{' '}
                                  {attendance.movements &&
                                    attendance.movements.length > 0 &&
                                    `(${attendance.movements.length})`}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/dashboard/workforce/attendance/${attendance.id}`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {filteredAttendance.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>

        {/* Movement Tracking Dialog */}
        <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Route className="h-5 w-5 text-blue-600" />
                <span>Track Employee Movement</span>
              </DialogTitle>
              <DialogDescription>
                Record and manage employee movements during work hours
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Movement Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="movementType">Movement Type *</Label>
                  <Select
                    value={newMovement.type}
                    onValueChange={(value) =>
                      setNewMovement({
                        ...newMovement,
                        type: value as MovementType,
                      })
                    }
                  >
                    <SelectTrigger id="movementType">
                      <SelectValue placeholder="Select movement type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(MovementType).map((type) => {
                        const iconName = getMovementTypeIcon(type);
                        const iconMap: Record<string, typeof Car> = {
                          Car,
                          Users,
                          Package,
                          Home,
                          MapPin,
                          GraduationCap,
                          Building,
                          ClipboardCheck,
                          ShoppingCart,
                          Eye,
                          MoreHorizontal,
                          Briefcase,
                          HandshakeIcon,
                          Wrench,
                          FileText,
                        };
                        const Icon = iconMap[iconName] || Route;

                        return (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" />
                              <span>{getMovementTypeLabel(type)}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromLocation">From Location *</Label>
                  <Input
                    id="fromLocation"
                    placeholder="e.g., Main Office"
                    value={newMovement.fromLocation}
                    onChange={(e) =>
                      setNewMovement({
                        ...newMovement,
                        fromLocation: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="toLocation">To Location *</Label>
                  <Input
                    id="toLocation"
                    placeholder="e.g., Site A, Client Office"
                    value={newMovement.toLocation}
                    onChange={(e) =>
                      setNewMovement({
                        ...newMovement,
                        toLocation: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Time Details */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newMovement.startTime}
                    onChange={(e) =>
                      setNewMovement({
                        ...newMovement,
                        startTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newMovement.endTime}
                    onChange={(e) =>
                      setNewMovement({
                        ...newMovement,
                        endTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="distance">Distance (km)</Label>
                  <Input
                    id="distance"
                    type="number"
                    placeholder="0"
                    value={newMovement.distanceKm || ''}
                    onChange={(e) =>
                      setNewMovement({
                        ...newMovement,
                        distanceKm: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <Label htmlFor="purpose">Purpose / Notes *</Label>
                <Textarea
                  id="purpose"
                  placeholder="Describe the purpose of this movement..."
                  rows={3}
                  value={newMovement.purpose}
                  onChange={(e) =>
                    setNewMovement({ ...newMovement, purpose: e.target.value })
                  }
                />
              </div>

              {/* Quick Info */}
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="mb-1 font-medium">
                      Movement Tracking Features
                    </p>
                    <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                      <li>• GPS coordinates will be automatically captured</li>
                      <li>
                        • Photo verification can be added for start/end points
                      </li>
                      <li>• Movements can be verified by supervisors</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setMovementDialogOpen(false);
                  setNewMovement({
                    type: MovementType.siteTravel,
                    fromLocation: '',
                    toLocation: '',
                    startTime: '',
                    endTime: '',
                    purpose: '',
                    distanceKm: 0,
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement save movement logic
                  toast.success('Movement Recorded', {
                    description: `${getMovementTypeLabel(newMovement.type)} movement has been recorded successfully.`,
                  });
                  setMovementDialogOpen(false);
                  setNewMovement({
                    type: MovementType.siteTravel,
                    fromLocation: '',
                    toLocation: '',
                    startTime: '',
                    endTime: '',
                    purpose: '',
                    distanceKm: 0,
                  });
                }}
                disabled={
                  !newMovement.fromLocation ||
                  !newMovement.toLocation ||
                  !newMovement.startTime ||
                  !newMovement.endTime ||
                  !newMovement.purpose
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Movement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
