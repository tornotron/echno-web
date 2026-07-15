'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Textarea } from '@/components/shadcn/textarea';
import { Label } from '@/components/shadcn/label';
import { Separator } from '@/components/shadcn/separator';
import {
  MapPin,
  CheckCircle,
  AlertTriangle,
  Loader2,
  LogIn,
  LogOut,
  Coffee,
  PlayCircle,
  XCircle,
  RefreshCw,
  Camera,
  RotateCcw,
} from 'lucide-react';
import type {
  Attendance,
  AttendanceProfile,
} from '@tornotron/echno-core/attendance/types';
import type { Project } from '@tornotron/echno-core/project/types';
import {
  ClockEventType,
  calculateDistance,
  type GeoLocation,
} from '@tornotron/echno-core/attendance/types';
import { useProjectsByEmployee } from '@tornotron/echno-core/project/hooks';
import {
  useOrgSettings,
  useProjectSettings,
} from '@tornotron/echno-core/attendance-settings/hooks';
import { useShifts } from '@tornotron/echno-core/shift-timing/hooks';
import {
  useCheckIn,
  useRecordClockEvent,
} from '@tornotron/echno-core/attendance/hooks';
import { toast } from '@/lib/styles/toast-styles';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

type LocationState =
  | { status: 'idle' }
  | { status: 'detecting' }
  | { status: 'detected'; location: GeoLocation }
  | { status: 'error'; message: string };

type CameraState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'active'; stream: MediaStream }
  | { status: 'captured'; photo: File; previewUrl: string }
  | { status: 'error'; message: string };

type ProjectMatch = {
  project: Project;
  distance: number;
};

type NextAction = {
  eventType: ClockEventType;
  label: string;
  Icon: React.ElementType;
} | null;

// ─── Action config ────────────────────────────────────────────────────────────

const ACTION_CONFIG: Partial<
  Record<
    ClockEventType,
    {
      bannerClass: string;
      iconClass: string;
      badgeClass: string;
    }
  >
> = {
  [ClockEventType.morningClockIn]: {
    bannerClass:
      'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
    iconClass: 'text-emerald-600',
    badgeClass: 'bg-emerald-500 hover:bg-emerald-600',
  },
  [ClockEventType.lunchBreakStart]: {
    bannerClass:
      'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    iconClass: 'text-amber-600',
    badgeClass: 'bg-amber-500 hover:bg-amber-600',
  },
  [ClockEventType.lunchBreakEnd]: {
    bannerClass:
      'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    iconClass: 'text-blue-600',
    badgeClass: 'bg-blue-500 hover:bg-blue-600',
  },
  [ClockEventType.eveningClockOut]: {
    bannerClass:
      'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700',
    iconClass: 'text-slate-600',
    badgeClass: 'bg-slate-600 hover:bg-slate-700',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_GEOFENCE_RADIUS = 100;

function getEffectiveProfile(
  profile: AttendanceProfile | null | undefined
): Pick<
  AttendanceProfile,
  | 'checkInOutCycles'
  | 'geolocationRequired'
  | 'geofenceRadiusMeters'
  | 'photoRequiredOnCheckIn'
  | 'photoRequiredOnCheckOut'
  | 'defaultShiftId'
> {
  if (profile) return profile;
  return {
    checkInOutCycles: 2,
    geolocationRequired: false,
    geofenceRadiusMeters: DEFAULT_GEOFENCE_RADIUS,
    photoRequiredOnCheckIn: false,
    photoRequiredOnCheckOut: false,
    defaultShiftId: undefined,
  };
}

function getNextAction(
  record: Attendance | undefined,
  cycles: number
): NextAction {
  if (!record || !record.morningClockIn) {
    return {
      eventType: ClockEventType.morningClockIn,
      label: 'Clock In',
      Icon: LogIn,
    };
  }
  if (cycles >= 2) {
    if (!record.lunchBreakStart) {
      return {
        eventType: ClockEventType.lunchBreakStart,
        label: 'Start Lunch Break',
        Icon: Coffee,
      };
    }
    if (!record.lunchBreakEnd) {
      return {
        eventType: ClockEventType.lunchBreakEnd,
        label: 'End Lunch Break',
        Icon: PlayCircle,
      };
    }
  }
  if (!record.eveningClockOut) {
    return {
      eventType: ClockEventType.eveningClockOut,
      label: 'Clock Out',
      Icon: LogOut,
    };
  }
  return null;
}

function isPhotoRequired(
  profile: ReturnType<typeof getEffectiveProfile> | null,
  action: NextAction
): boolean {
  if (!profile || !action) return false;
  if (action.eventType === ClockEventType.morningClockIn)
    return profile.photoRequiredOnCheckIn;
  if (action.eventType === ClockEventType.eveningClockOut)
    return profile.photoRequiredOnCheckOut;
  return false;
}

function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function formatCoord(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}°${latDir}, ${Math.abs(lng).toFixed(5)}°${lngDir}`;
}

// ─── Canvas watermark ─────────────────────────────────────────────────────────

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  lines: string[]
) {
  const fontSize = Math.round(Math.max(11, w * 0.022));
  const lineHeight = fontSize * 1.55;
  const pad = fontSize * 0.8;

  ctx.save();
  ctx.font = `${fontSize}px 'Courier New', Courier, monospace`;

  let textW = 0;
  for (const line of lines) {
    const lineWidth = ctx.measureText(line).width;
    if (lineWidth > textW) textW = lineWidth;
  }
  const boxW = textW + pad * 2;
  const boxH = lines.length * lineHeight + pad;
  const x = w - boxW - pad * 0.5;
  const y = h - boxH - pad * 0.5;

  ctx.fillStyle = 'rgba(0,0,0,0.58)';
  const r = 4;
  ctx.beginPath();
  if (typeof (ctx as { roundRect?: unknown }).roundRect === 'function') {
    (
      ctx as unknown as {
        roundRect: (
          x: number,
          y: number,
          w: number,
          h: number,
          r: number
        ) => void;
      }
    ).roundRect(x, y, boxW, boxH, r);
  } else {
    ctx.rect(x, y, boxW, boxH);
  }
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';
  for (const [i, line] of lines.entries()) {
    ctx.fillText(line, x + pad, y + pad * 0.5 + i * lineHeight);
  }

  ctx.restore();
}

// ─── Camera capture hook ──────────────────────────────────────────────────────

function useCameraCapture() {
  // videoRef is used by capture() to drawImage — kept as a plain ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>({
    status: 'idle',
  });
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Callback ref — fires synchronously when the <video> element mounts/unmounts.
  // At mount time streamRef.current is already set, so srcObject assignment is immediate.
  const videoCallbackRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsVideoReady(false);
    setCameraState({ status: 'requesting' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      // Changing state to 'active' causes React to mount the <video> element.
      // videoCallbackRef fires at that point and sets srcObject immediately.
      setCameraState({ status: 'active', stream });
    } catch (error) {
      const msg =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera access and try again.'
          : 'Could not access camera. Please check your device.';
      setCameraState({ status: 'error', message: msg });
    }
  }, []);

  // Called from <video onCanPlay> — video has frames ready to draw
  const onVideoReady = useCallback(() => setIsVideoReady(true), []);

  const capture = useCallback((watermarkLines?: string[]) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Guard: video must have actual frame data (readyState >= HAVE_CURRENT_DATA)
    if (video.readyState < 2 || video.videoWidth === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror horizontally to match the selfie viewfinder display
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.restore();

    if (watermarkLines?.length) {
      drawWatermark(ctx, canvas.width, canvas.height, watermarkLines);
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        const previewUrl = URL.createObjectURL(blob);
        previewUrlRef.current = previewUrl;

        const stream = streamRef.current;
        if (stream) {
          for (const t of stream.getTracks()) t.stop();
        }
        streamRef.current = null;

        setCameraState({ status: 'captured', photo: file, previewUrl });
      },
      'image/jpeg',
      0.85
    );
  }, []);

  const retake = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    startCamera();
  }, [startCamera]);

  // Stable — no dep on cameraState; uses refs for cleanup
  const stopCamera = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      for (const t of stream.getTracks()) t.stop();
    }
    streamRef.current = null;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setIsVideoReady(false);
    setCameraState((prev) =>
      prev.status === 'idle' ? prev : { status: 'idle' }
    );
  }, []);

  return {
    videoCallbackRef,
    canvasRef,
    cameraState,
    isVideoReady,
    onVideoReady,
    startCamera,
    capture,
    retake,
    stopCamera,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  employeeId: number;
  todayRecord?: Attendance;
}

function MarkAttendanceDialog({ onClose, employeeId, todayRecord }: Props) {
  // The parent mounts this dialog only while open, so the initial state is the
  // dialog's "just opened" state. `detecting` and `idle` render the same
  // spinner UI, so starting at `detecting` removes the synchronous setState we
  // would otherwise need in the auto-detect effect.
  const [locationState, setLocationState] = useState<LocationState>(() =>
    navigator?.geolocation
      ? { status: 'detecting' }
      : {
          status: 'error',
          message: 'Geolocation is not supported by your browser.',
        }
  );
  const [projectMatch, setProjectMatch] = useState<ProjectMatch | null>(null);
  const [remarks, setRemarks] = useState('');

  const { data: projects = [] } = useProjectsByEmployee(employeeId);
  const { data: orgSettings } = useOrgSettings();
  const { data: projectSettings } = useProjectSettings(
    projectMatch?.project.id
  );
  const { data: shifts = [] } = useShifts();

  const checkInMutation = useCheckIn();
  const clockEventMutation = useRecordClockEvent();
  const isPending = checkInMutation.isPending || clockEventMutation.isPending;

  const {
    videoCallbackRef,
    canvasRef,
    cameraState,
    isVideoReady,
    onVideoReady,
    startCamera,
    capture,
    retake,
    stopCamera,
  } = useCameraCapture();

  // ── Derived ─────────────────────────────────────────────────────────────────

  // Priority: project-specific settings → org-level default → hardcoded fallback
  const liveProfile = projectSettings ?? orgSettings ?? null;
  const effectiveProfile = getEffectiveProfile(liveProfile);
  const cycles = effectiveProfile.checkInOutCycles;
  // Compute action regardless of project match so the form shows while location detects
  const nextAction = getNextAction(todayRecord, cycles);
  const nextActionEventType = nextAction?.eventType ?? null;

  const geolocationRequired = effectiveProfile.geolocationRequired;
  const isWithinGeofence = projectMatch
    ? projectMatch.distance <= effectiveProfile.geofenceRadiusMeters
    : false;
  const isGeoBlocked =
    geolocationRequired && projectMatch !== null && !isWithinGeofence;
  // Show camera only when the attendance profile requires a photo for this action
  const photoRequired = isPhotoRequired(effectiveProfile, nextAction);
  const photoMissing = photoRequired && cameraState.status !== 'captured';

  const resolvedShiftId = effectiveProfile.defaultShiftId ?? shifts[0]?.id ?? 1;

  const actionCfg = nextAction
    ? (ACTION_CONFIG[nextAction.eventType] ??
      ACTION_CONFIG[ClockEventType.morningClockIn]!)
    : null;

  // ── Location detection ───────────────────────────────────────────────────────

  // Shared geolocation flow. Assumes `navigator.geolocation` exists — callers
  // are responsible for the unavailable case (the `useState` initializer
  // already seeds an error state on mount, and the Retry event handler
  // re-checks below). State transitions live only inside the success/error
  // callbacks, so this helper is safe to invoke from an effect.
  const performLocationDetection = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location: GeoLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude ?? undefined,
        };

        let nearest: ProjectMatch | null = null;
        let minDist = Infinity;
        for (const project of projects) {
          if (
            project.projectLatitude == null ||
            project.projectLongitude == null
          ) {
            continue;
          }
          const projLoc: GeoLocation = {
            latitude: project.projectLatitude,
            longitude: project.projectLongitude,
          };
          const distance = calculateDistance(location, projLoc);
          if (distance < minDist) {
            minDist = distance;
            nearest = { project, distance };
          }
        }
        // No project has GPS coordinates — fall back to the first assigned project.
        if (!nearest && projects.length > 0) {
          nearest = { project: projects[0], distance: 0 };
        }

        setLocationState({ status: 'detected', location });
        setProjectMatch(nearest);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location access denied. Please allow location access and try again.',
          2: 'Unable to determine your location. Please try again.',
          3: 'Location request timed out. Please try again.',
        };
        setLocationState({
          status: 'error',
          message: messages[err.code] ?? 'Failed to get location.',
        });
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 }
    );
  }, [projects]);

  // Retry button entrypoint — handles the unavailable-geolocation case
  // (surfacing the error toast-style message in state) then resets to the
  // detecting state and re-runs the shared flow. Called from an event
  // handler, so the synchronous setState calls here are fine.
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState({
        status: 'error',
        message: 'Geolocation is not supported by your browser.',
      });
      setProjectMatch(null);
      return;
    }
    setLocationState({ status: 'detecting' });
    setProjectMatch(null);
    performLocationDetection();
  }, [performLocationDetection]);

  // Auto-detect on mount once projects load. Initial state is already
  // `detecting`, so the effect body itself doesn't setState — only the
  // geolocation API's async callbacks do, which the lint rule allows for
  // "subscribing to an external system".
  useEffect(() => {
    if (locationState.status !== 'detecting') return;
    if (projects.length === 0) return;
    performLocationDetection();
  }, [locationState.status, projects.length, performLocationDetection]);

  // Auto-start camera once the profile says a photo is required and we have a
  // next action. startCamera's setState runs in the API's async resolve, not
  // synchronously in this effect body.
  useEffect(() => {
    if (
      !photoRequired ||
      cameraState.status !== 'idle' ||
      nextActionEventType === null ||
      isGeoBlocked
    ) {
      return;
    }
    void startCamera();
  }, [
    photoRequired,
    cameraState.status,
    nextActionEventType,
    isGeoBlocked,
    startCamera,
  ]);

  // Stop the camera if the component unmounts while it's running.
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!projectMatch || !nextAction) return;

    const now = new Date();
    const location =
      locationState.status === 'detected' ? locationState.location : undefined;
    const photo =
      cameraState.status === 'captured' ? cameraState.photo : undefined;

    try {
      await (!todayRecord ||
      nextAction.eventType === ClockEventType.morningClockIn
        ? checkInMutation.mutateAsync({
            employeeId,
            projectId: projectMatch.project.id,
            shiftTimingId: resolvedShiftId,
            eventTimestamp: now,
            location,
            photo,
            remarks: remarks || undefined,
          })
        : clockEventMutation.mutateAsync({
            attendanceId: todayRecord.id,
            eventType: nextAction.eventType,
            eventTimestamp: now,
            location,
            photo,
            remarks: remarks || undefined,
          }));

      toast.success(`${nextAction.label} recorded`, {
        description: `${projectMatch.project.projectName} · ${format(now, 'HH:mm')}`,
      });
      onClose();
    } catch {
      toast.error(`Failed to record ${nextAction.label.toLowerCase()}`);
    }
  };

  // Build watermark lines for captured photo
  const buildWatermarkLines = useCallback((): string[] => {
    const lines: string[] = [];
    if (locationState.status === 'detected') {
      lines.push(
        formatCoord(
          locationState.location.latitude,
          locationState.location.longitude
        )
      );
    }
    lines.push(format(new Date(), 'dd MMM yyyy · HH:mm'));
    return lines;
  }, [locationState]);

  const handleCapture = useCallback(() => {
    capture(buildWatermarkLines());
  }, [capture, buildWatermarkLines]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle className="text-lg">Mark Attendance</DialogTitle>
          <DialogDescription>
            {format(new Date(), 'EEEE, MMMM dd · HH:mm')}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          <div className="space-y-3">
            {/* Action banner */}
            {nextAction && actionCfg && (
              <div
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${actionCfg.bannerClass}`}
              >
                <nextAction.Icon
                  className={`h-5 w-5 shrink-0 ${actionCfg.iconClass}`}
                />
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${actionCfg.iconClass}`}>
                    {nextAction.label}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Tap the button below to record
                  </p>
                </div>
                <Badge className={actionCfg.badgeClass}>
                  {format(new Date(), 'HH:mm')}
                </Badge>
              </div>
            )}

            {/* Location + project grouped */}
            <div className="space-y-2">
              <LocationStatus state={locationState} onRetry={detectLocation} />
              {locationState.status === 'detected' && (
                <ProjectMatchCard
                  match={projectMatch}
                  isWithinGeofence={isWithinGeofence}
                  profile={liveProfile}
                  cycles={effectiveProfile.checkInOutCycles}
                />
              )}
            </div>

            {/* All done state */}
            {nextAction === null && projectMatch && (
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  All attendance events recorded for today
                </p>
              </div>
            )}

            {/* Geofence blocked */}
            {isGeoBlocked && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  You are outside the project geofence. Move closer to the site
                  to mark attendance.
                </p>
              </div>
            )}

            {/* Form */}
            {nextAction && !isGeoBlocked && (
              <>
                <Separator className="my-1" />

                {/* Camera — only shown when profile requires a photo for this action */}
                {photoRequired && (
                  <CameraCapture
                    state={cameraState}
                    isVideoReady={isVideoReady}
                    onVideoReady={onVideoReady}
                    videoCallbackRef={videoCallbackRef}
                    canvasRef={canvasRef}
                    onStart={startCamera}
                    onCapture={handleCapture}
                    onRetake={retake}
                  />
                )}

                {/* Remarks */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="att-remarks"
                    className="text-muted-foreground text-sm"
                  >
                    Remarks <span className="text-xs">(optional)</span>
                  </Label>
                  <Textarea
                    id="att-remarks"
                    placeholder="Add any notes…"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2}
                    disabled={isPending}
                    className="resize-none text-sm"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-4">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
              className="min-w-[80px]"
            >
              Cancel
            </Button>
            {nextAction && !isGeoBlocked && (
              <Button
                onClick={handleSubmit}
                disabled={isPending || !projectMatch || photoMissing}
                className="min-w-[140px]"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <nextAction.Icon className="mr-2 h-4 w-4" />
                )}
                {isPending ? 'Recording…' : nextAction.label}
                {!isPending && photoMissing && (
                  <span className="ml-1 text-xs opacity-70">
                    (photo needed)
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MarkAttendanceDialog;

// ─── Camera capture UI ────────────────────────────────────────────────────────

interface CameraCaptureProps {
  state: CameraState;
  isVideoReady: boolean;
  onVideoReady: () => void;
  videoCallbackRef: (el: HTMLVideoElement | null) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onStart: () => void;
  onCapture: () => void;
  onRetake: () => void;
}

function CameraCapture({
  state,
  isVideoReady,
  onVideoReady,
  videoCallbackRef,
  canvasRef,
  onStart,
  onCapture,
  onRetake,
}: CameraCaptureProps) {
  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-sm">
          <Camera className="h-4 w-4" />
          Photo
          <span className="text-destructive">*</span>
        </Label>
        {state.status === 'captured' && (
          <Badge
            variant="secondary"
            className="h-6 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Captured
          </Badge>
        )}
      </div>

      {/* Requesting permission */}
      {state.status === 'requesting' && (
        <div className="bg-muted flex aspect-[4/3] items-center justify-center rounded-xl">
          <div className="text-center">
            <Loader2 className="text-muted-foreground mx-auto mb-2 h-7 w-7 animate-spin" />
            <p className="text-muted-foreground text-sm">Accessing camera…</p>
          </div>
        </div>
      )}

      {/* Live viewfinder */}
      {state.status === 'active' && (
        <div className="group relative overflow-hidden rounded-xl bg-black">
          {/* Live indicator */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-xs font-semibold text-white">LIVE</span>
          </div>

          {}
          <video
            ref={videoCallbackRef}
            autoPlay
            playsInline
            muted
            onCanPlay={onVideoReady}
            className="w-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Shutter button — disabled until video has frames */}
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <button
              type="button"
              onClick={onCapture}
              disabled={!isVideoReady}
              aria-label="Capture photo"
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 shadow-lg backdrop-blur-sm transition-transform hover:scale-105 active:scale-90 disabled:opacity-50"
            >
              {isVideoReady ? (
                <span className="h-11 w-11 rounded-full bg-white shadow-inner" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Photo preview */}
      {state.status === 'captured' && (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.previewUrl}
              alt="Captured selfie"
              className="w-full object-cover"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-full text-xs"
            onClick={onRetake}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Retake Photo
          </Button>
        </div>
      )}

      {/* Camera error */}
      {state.status === 'error' && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="flex-1 text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={onStart}
            className="h-7 shrink-0 text-xs"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ─── Location status ──────────────────────────────────────────────────────────

function LocationStatus({
  state,
  onRetry,
}: {
  state: LocationState;
  onRetry: () => void;
}) {
  if (state.status === 'idle' || state.status === 'detecting') {
    return (
      <div className="bg-muted/60 flex items-center gap-3 rounded-lg px-3 py-2.5">
        <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
        <div>
          <p className="text-sm font-medium">Detecting location…</p>
          <p className="text-muted-foreground text-xs">
            Allow location access when prompted
          </p>
        </div>
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="bg-muted/60 flex items-start gap-3 rounded-lg px-3 py-2.5">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <div className="flex-1 space-y-0.5">
          <p className="text-sm font-medium">Location unavailable</p>
          <p className="text-muted-foreground text-xs">{state.message}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="h-7 shrink-0 text-xs"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry
        </Button>
      </div>
    );
  }
  return (
    <div className="bg-muted/60 flex items-center gap-3 rounded-lg px-3 py-2.5">
      <MapPin className="h-4 w-4 shrink-0 text-green-600" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {formatCoord(state.location.latitude, state.location.longitude)}
        </p>
        <p className="text-muted-foreground text-xs">
          ±{Math.round(state.location.accuracy ?? 0)} m accuracy
        </p>
      </div>
      <Badge
        variant="outline"
        className="shrink-0 border-green-300 text-xs text-green-700 dark:border-green-700 dark:text-green-400"
      >
        GPS
      </Badge>
    </div>
  );
}

// ─── Project match card ───────────────────────────────────────────────────────

function ProjectMatchCard({
  match,
  isWithinGeofence,
  profile,
  cycles,
}: {
  match: ProjectMatch | null;
  isWithinGeofence: boolean;
  profile: AttendanceProfile | null | undefined;
  cycles: number;
}) {
  if (!match) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-medium">No nearby project found</p>
          <p className="text-muted-foreground text-xs">
            Make sure you are at your assigned project site
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {match.project.projectName}
          </p>
          {match.project.projectAddress && (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {match.project.projectAddress}
            </p>
          )}
        </div>
        {isWithinGeofence ? (
          <Badge className="shrink-0 bg-green-500 text-xs hover:bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            In Range
          </Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0 text-xs">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {formatDistance(match.distance)} away
          </Badge>
        )}
      </div>
      <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <span>{formatDistance(match.distance)} from site</span>
        <span>·</span>
        <span>{cycles}-cycle day</span>
        <span>·</span>
        <span className={profile ? 'text-blue-600 dark:text-blue-400' : ''}>
          {profile ? profile.settingName : 'Default settings'}
        </span>
      </div>
    </div>
  );
}
