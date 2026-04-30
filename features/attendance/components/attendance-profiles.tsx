import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import {
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Camera,
  MapPin,
  Route,
  ShieldCheck,
  RefreshCw,
  AlarmClock,
} from 'lucide-react';
import { getCycleLabel } from '../../../hooks/attendance/use-attendance-settings';
import type { ShiftTiming, AttendanceProfile } from '@/types/attendance';

// ─── Sub-component ────────────────────────────────────────────────────────────

function FeaturePill({
  icon,
  label,
  value,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
        active
          ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
          : 'bg-zinc-50 text-zinc-400 line-through dark:bg-zinc-900 dark:text-zinc-600'
      }`}
    >
      <span className={active ? 'text-zinc-500 dark:text-zinc-400' : ''}>
        {icon}
      </span>
      <span>
        {label}
        {value && active && (
          <span className="ml-1 font-semibold text-zinc-900 dark:text-zinc-100">
            {value}
          </span>
        )}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AttendanceProfilesProps {
  profiles: AttendanceProfile[];
  shifts: ShiftTiming[];
  openNewProfile: () => void;
  openEditProfile: (profile: AttendanceProfile) => void;
  setDeleteTarget: (target: {
    type: 'shift' | 'profile';
    id: number;
    name: string;
  }) => void;
  setDeleteDialogOpen: (open: boolean) => void;
}

export function AttendanceProfiles({
  profiles,
  shifts,
  openNewProfile,
  openEditProfile,
  setDeleteTarget,
  setDeleteDialogOpen,
}: AttendanceProfilesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Attendance Profiles
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Organization-wide defaults and per-project overrides. A
            project-specific profile takes priority over the org default.
          </p>
        </div>
        <Button onClick={openNewProfile}>
          <Plus className="mr-2 h-4 w-4" />
          New Profile
        </Button>
      </div>

      <div className="grid gap-4">
        {profiles.map((profile) => (
          <Card
            key={profile.id}
            className="border-zinc-200 dark:border-zinc-800"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">
                      {profile.settingName}
                    </CardTitle>
                    {profile.projectName ? (
                      <Badge
                        variant="outline"
                        className="border-blue-300 text-blue-700 dark:text-blue-400"
                      >
                        {profile.projectName}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-zinc-300 text-zinc-600 dark:text-zinc-400"
                      >
                        Org Default
                      </Badge>
                    )}
                    {!profile.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    {getCycleLabel(profile.checkInOutCycles)}
                    {(() => {
                      const matched = shifts.find(
                        (s) => s.id === profile.defaultShiftId
                      );
                      return matched ? ` · ${matched.shiftName}` : '';
                    })()}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditProfile(profile)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        setDeleteTarget({
                          type: 'profile',
                          id: profile.id,
                          name: profile.settingName,
                        });
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <FeaturePill
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                  label="Check-in cycles"
                  value={String(profile.checkInOutCycles)}
                  active
                />
                <FeaturePill
                  icon={<Camera className="h-3.5 w-3.5" />}
                  label="Photo on check-in"
                  active={profile.photoRequiredOnCheckIn}
                />
                <FeaturePill
                  icon={<Camera className="h-3.5 w-3.5" />}
                  label="Photo on check-out"
                  active={profile.photoRequiredOnCheckOut}
                />
                <FeaturePill
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label={`Geofence ${profile.geofenceRadiusMeters}m`}
                  active={profile.geolocationRequired}
                />
                <FeaturePill
                  icon={<Route className="h-3.5 w-3.5" />}
                  label="Movement tracking"
                  active={profile.movementTrackingEnabled}
                />
                <FeaturePill
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  label="Self-regularization"
                  active={profile.allowSelfRegularization}
                />
                <FeaturePill
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  label={`Max ${profile.maxRegularizationDaysPerMonth} reg/mo`}
                  active
                />
                <FeaturePill
                  icon={<AlarmClock className="h-3.5 w-3.5" />}
                  label={`Auto-absent ${profile.autoMarkAbsentAfterHours}h`}
                  active
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
