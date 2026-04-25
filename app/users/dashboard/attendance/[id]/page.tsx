'use client';

import { use } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Clock,
  MapPin,
  Camera,
  CheckCircle,
  XCircle,
  User,
  Building,
  Coffee,
  LogIn,
  LogOut,
  PlayCircle,
  AlertTriangle,
  Download,
  Route,
  Car,
  Users,
  Package,
  Home,
  GraduationCap,
  ClipboardCheck,
  ShoppingCart,
  Eye,
  MoreHorizontal,
  Navigation,
} from 'lucide-react';
import { mockAttendance } from '@/components/shared/mock-data';
import {
  getAttendanceStatusLabel,
  getAttendanceStatusColor,
  ClockEventType,
  getClockEventLabel,
  getMovementTypeLabel,
  getMovementTypeIcon,
} from '@/types/attendance';
import { format } from 'date-fns';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AttendanceDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const attendance = mockAttendance.find((a) => a.id === Number.parseInt(id));

  if (!attendance) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Attendance record not found
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              The attendance record you&apos;re looking for doesn&apos;t exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clockEvents = [
    {
      event: attendance.morningClockIn,
      type: ClockEventType.morningClockIn,
      icon: LogIn,
      color: 'green',
    },
    {
      event: attendance.lunchBreakStart,
      type: ClockEventType.lunchBreakStart,
      icon: Coffee,
      color: 'orange',
    },
    {
      event: attendance.lunchBreakEnd,
      type: ClockEventType.lunchBreakEnd,
      icon: PlayCircle,
      color: 'blue',
    },
    {
      event: attendance.eveningClockOut,
      type: ClockEventType.eveningClockOut,
      icon: LogOut,
      color: 'red',
    },
  ].filter((item) => item.event);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Attendance Details
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {format(attendance.date, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {attendance.approvalStatus === 'pending' && (
            <>
              <Button
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                Reject
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Employee & Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Employee & Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Employee
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {attendance.employeeName}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500">
                      {attendance.employeeId}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Project
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {attendance.projectName}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500">
                      ID: {attendance.projectId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Attendance Status
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        {
                          green:
                            'border-green-500 text-green-700 dark:text-green-400',
                          red: 'border-red-500 text-red-700 dark:text-red-400',
                          orange:
                            'border-orange-500 text-orange-700 dark:text-orange-400',
                          yellow:
                            'border-yellow-500 text-yellow-700 dark:text-yellow-400',
                          teal: 'border-teal-500 text-teal-700 dark:text-teal-400',
                          amber:
                            'border-indigo-500 text-amber-700 dark:text-amber-400',
                        }[getAttendanceStatusColor(attendance.status)] ||
                        'border-zinc-500 text-zinc-700 dark:text-zinc-400'
                      }
                    >
                      {getAttendanceStatusLabel(attendance.status)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Approval Status
                    </p>
                    <Badge
                      variant={
                        ({
                          approved: 'default',
                          rejected: 'destructive',
                          pending: 'outline',
                        }[attendance.approvalStatus] || 'outline') as
                          | 'default'
                          | 'destructive'
                          | 'outline'
                      }
                    >
                      {attendance.approvalStatus.charAt(0).toUpperCase() +
                        attendance.approvalStatus.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Duration Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Work Duration Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
                  <Clock className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {attendance.workDuration.hours}h{' '}
                    {attendance.workDuration.minutes}m
                  </p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    Total Hours
                  </p>
                </div>

                <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                  <Clock className="mx-auto mb-2 h-6 w-6 text-green-600 dark:text-green-400" />
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {Math.floor(attendance.workDuration.morningSession / 60)}h{' '}
                    {attendance.workDuration.morningSession % 60}m
                  </p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    Morning
                  </p>
                </div>

                <div className="rounded-lg bg-purple-50 p-4 text-center dark:bg-purple-900/20">
                  <Clock className="mx-auto mb-2 h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {Math.floor(attendance.workDuration.afternoonSession / 60)}h{' '}
                    {attendance.workDuration.afternoonSession % 60}m
                  </p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    Afternoon
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50 p-4 text-center dark:bg-orange-900/20">
                  <Coffee className="mx-auto mb-2 h-6 w-6 text-orange-600 dark:text-orange-400" />
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {Math.floor(attendance.workDuration.breakDuration / 60)}h{' '}
                    {attendance.workDuration.breakDuration % 60}m
                  </p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    Break Time
                  </p>
                </div>
              </div>

              {attendance.isOvertime && (
                <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-900/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-teal-900 dark:text-teal-100">
                        Overtime Detected
                      </p>
                      <p className="mt-1 text-sm text-teal-700 dark:text-teal-300">
                        Employee worked beyond standard hours
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                        +
                        {Math.floor(
                          attendance.workDuration.overtimeMinutes / 60
                        )}
                        h {attendance.workDuration.overtimeMinutes % 60}m
                      </p>
                      <p className="text-xs text-teal-600 dark:text-teal-400">
                        Overtime Hours
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clock Events Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Clock Events Timeline</CardTitle>
              <CardDescription>
                All clock-in and clock-out events for this day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clockEvents.map(
                  ({ event, type, icon: Icon, color }, index) => {
                    if (!event) return null;
                    return (
                      <div
                        key={index}
                        className="relative border-l-2 border-zinc-200 pb-4 pl-8 last:border-l-0 last:pb-0 dark:border-zinc-800"
                      >
                        <div
                          className={`absolute top-0 left-0 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full ${
                            {
                              green: 'bg-green-100 dark:bg-green-900/30',
                              red: 'bg-red-100 dark:bg-red-900/30',
                              blue: 'bg-blue-100 dark:bg-blue-900/30',
                              orange: 'bg-orange-100 dark:bg-orange-900/30',
                            }[color] || 'bg-orange-100 dark:bg-orange-900/30'
                          } `}
                        >
                          <Icon
                            className={`h-3 w-3 ${
                              {
                                green: 'text-green-600 dark:text-green-400',
                                red: 'text-red-600 dark:text-red-400',
                                blue: 'text-blue-600 dark:text-blue-400',
                                orange: 'text-orange-600 dark:text-orange-400',
                              }[color] || 'text-orange-600 dark:text-orange-400'
                            } `}
                          />
                        </div>

                        <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/50">
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {getClockEventLabel(type)}
                              </p>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                {format(event.timestamp, 'h:mm:ss a')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {event.isWithinGeofence ? (
                                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-xs">
                                    Within Geofence
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                                  <XCircle className="h-4 w-4" />
                                  <span className="text-xs">
                                    Outside Geofence
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-start space-x-2 text-zinc-600 dark:text-zinc-400">
                              <MapPin className="mt-0.5 h-4 w-4" />
                              <div>
                                <p className="text-xs">Location</p>
                                <p className="font-mono text-xs">
                                  {event.location.latitude.toFixed(6)},{' '}
                                  {event.location.longitude.toFixed(6)}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                  {event.distanceFromProject}m from project
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start space-x-2 text-zinc-600 dark:text-zinc-400">
                              <Camera className="mt-0.5 h-4 w-4" />
                              <div>
                                <p className="mb-2 text-xs">Photo Captured</p>
                                {event.photoUrl ? (
                                  <a
                                    href={event.photoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <div className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-zinc-200 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500">
                                      <Image
                                        src={event.photoUrl}
                                        alt="Employee selfie"
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  </a>
                                ) : (
                                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                                    <Camera className="h-6 w-6 text-zinc-400" />
                                  </div>
                                )}
                                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                                  {event.deviceInfo?.platform || 'Web'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {event.remarks && (
                            <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                <span className="font-medium">Remarks:</span>{' '}
                                {event.remarks}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>

          {/* Regularization Request */}
          {attendance.regularization && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Regularization Request</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Reason
                  </p>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {attendance.regularization.reason}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Requested By
                    </p>
                    <p className="text-zinc-900 dark:text-zinc-100">
                      {attendance.regularization.requestedBy}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      {format(
                        attendance.regularization.requestedAt,
                        'MMM d, yyyy h:mm a'
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Status
                    </p>
                    <Badge
                      variant={
                        ({
                          approved: 'default',
                          rejected: 'destructive',
                          pending: 'outline',
                        }[attendance.regularization.status] || 'outline') as
                          | 'default'
                          | 'destructive'
                          | 'outline'
                      }
                    >
                      {attendance.regularization.status
                        .charAt(0)
                        .toUpperCase() +
                        attendance.regularization.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Missing Events
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {attendance.regularization.missingEvents.map(
                      (event, index) => (
                        <Badge key={index} variant="outline">
                          {event}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Remarks */}
          {attendance.remarks && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-700 dark:text-zinc-300">
                  {attendance.remarks}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shift Details */}
          <Card>
            <CardHeader>
              <CardTitle>Shift Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Shift Name
                </p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {attendance.shiftTiming.shiftName}
                </p>
              </div>

              <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Start Time
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {attendance.shiftTiming.startTime}
                  </span>
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    End Time
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {attendance.shiftTiming.endTime}
                  </span>
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Lunch Break
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {attendance.shiftTiming.lunchBreakStart} -{' '}
                    {attendance.shiftTiming.lunchBreakEnd}
                  </span>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Grace Period
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {attendance.shiftTiming.gracePeriodMinutes} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Min Work Hours
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {attendance.shiftTiming.minimumWorkHours}h
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Movements */}
          {attendance.movements && attendance.movements.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
                  <Route className="h-5 w-5" />
                  <span>Daily Movements</span>
                </CardTitle>
                <CardDescription>
                  {attendance.movements.length}{' '}
                  {attendance.movements.length === 1 ? 'movement' : 'movements'}{' '}
                  recorded
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {attendance.movements.map((movement, index) => {
                  const iconName = getMovementTypeIcon(movement.movementType);
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
                  };
                  const MovementIcon = iconMap[iconName] || Route;

                  return (
                    <div key={movement.id} className="relative">
                      {/* Timeline connector */}
                      {index < attendance.movements!.length - 1 && (
                        <div className="absolute top-10 bottom-0 left-4 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
                      )}

                      <div className="flex items-start space-x-3">
                        {/* Icon */}
                        <div
                          className={`relative z-10 shrink-0 rounded-lg border-2 border-blue-200 bg-white p-2 dark:border-blue-800 dark:bg-zinc-800`}
                        >
                          <MovementIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1 pb-3">
                          <div className="mb-1 flex items-start justify-between">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {getMovementTypeLabel(movement.movementType)}
                            </p>
                            {movement.isVerified && (
                              <CheckCircle className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
                            )}
                          </div>

                          <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">
                            {format(movement.startTime, 'h:mm a')}
                            {movement.endTime &&
                              ` - ${format(movement.endTime, 'h:mm a')}`}
                          </p>

                          {/* Locations - compact view */}
                          <div className="space-y-1">
                            <div className="flex items-start space-x-1 text-xs">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
                              <span className="truncate text-zinc-700 dark:text-zinc-300">
                                {movement.fromLocation}
                              </span>
                            </div>
                            {movement.toLocation && (
                              <div className="flex items-start space-x-1 text-xs">
                                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-red-600 dark:text-red-400" />
                                <span className="truncate text-zinc-700 dark:text-zinc-300">
                                  {movement.toLocation}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Distance */}
                          {movement.distance && (
                            <div className="mt-2 flex items-center space-x-1">
                              <Navigation className="h-3 w-3 text-zinc-400" />
                              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                {movement.distance} km
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Summary */}
                <div className="space-y-2 border-t border-blue-200 pt-3 dark:border-blue-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Total Distance
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {attendance.movements
                        .reduce((sum, m) => sum + (m.distance || 0), 0)
                        .toFixed(1)}{' '}
                      km
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Total Time
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {Math.floor(
                        attendance.movements.reduce(
                          (sum, m) => sum + (m.durationMinutes || 0),
                          0
                        ) / 60
                      )}
                      h{' '}
                      {attendance.movements.reduce(
                        (sum, m) => sum + (m.durationMinutes || 0),
                        0
                      ) % 60}
                      m
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Status Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Late Arrival
                </span>
                {attendance.isLateArrival ? (
                  <Badge
                    variant="outline"
                    className="border-orange-500 text-orange-700 dark:text-orange-400"
                  >
                    Yes
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-700 dark:text-green-400"
                  >
                    No
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Early Checkout
                </span>
                {attendance.isEarlyCheckout ? (
                  <Badge
                    variant="outline"
                    className="border-orange-500 text-orange-700 dark:text-orange-400"
                  >
                    Yes
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-700 dark:text-green-400"
                  >
                    No
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Overtime
                </span>
                {attendance.isOvertime ? (
                  <Badge
                    variant="outline"
                    className="border-teal-500 text-teal-700 dark:text-teal-400"
                  >
                    Yes
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-zinc-500 text-zinc-700 dark:text-zinc-400"
                  >
                    No
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Approval Info */}
          {attendance.approvedBy && attendance.approvedAt && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Approved By
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {attendance.approvedBy}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Approved At
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {format(attendance.approvedAt, 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    {format(attendance.approvedAt, 'h:mm a')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Record Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Created At
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {format(attendance.createdAt, 'MMM d, yyyy h:mm a')}
                </p>
              </div>

              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Last Updated
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {format(attendance.updatedAt, 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
