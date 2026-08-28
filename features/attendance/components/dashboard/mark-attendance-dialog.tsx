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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  MapPin,
  MapPinOff,
  Building2,
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

/**
 * Why the browser would not give us a position. Attendance is verified against
 * the site the employee is standing on, so a bare "location unavailable" leaves
 * them with nothing to act on. Each kind carries its own explanation and its own
 * next step.
 */
type LocationErrorKind =
  | 'unsupported'
  | 'insecure'
  | 'permission-required'
  | 'permission-denied'
  | 'position-unavailable'
  | 'timeout'
  | 'failed';

type LocationState =
  | { status: 'idle' }
  | { status: 'detecting' }
  | { status: 'detected'; location: GeoLocation }
  | { status: 'error'; kind: LocationErrorKind };

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

// ─── Location copy ────────────────────────────────────────────────────────────

/**
 * What the dialog says for each failure, and what it offers the employee next.
 * `allow` renders the button that triggers the browser's permission prompt;
 * `retry` re-reads the permission and asks for a position again; `none` is for
 * the cases the employee cannot fix from this screen.
 */
const LOCATION_ERROR_COPY: Record<
  LocationErrorKind,
  { title: string; body: string; action: 'allow' | 'retry' | 'none' }
> = {
  unsupported: {
    title: 'Location is not available on this device',
    body: 'This browser cannot report a location, so attendance cannot be verified here. Open Echno in a current version of Chrome, Safari, Edge or Firefox.',
    action: 'none',
  },
  insecure: {
    title: 'Location needs a secure connection',
    body: 'Browsers only share a location over HTTPS. Open Echno on its https:// address, then select Retry.',
    action: 'retry',
  },
  'permission-required': {
    title: 'Location access required',
    body: 'Your location is needed to verify that you are checking in from the permitted work location. It is read once, when you mark attendance.',
    action: 'allow',
  },
  'permission-denied': {
    title: 'Location permission is blocked',
    body: 'Echno was refused access to your location. Enable Location for this site in your browser or device settings, then return here and select Retry.',
    action: 'retry',
  },
  'position-unavailable': {
    title: 'Your location could not be determined',
    body: 'Your device could not get a fix. Check that location services are switched on, move somewhere with a clearer view of the sky, then select Retry.',
    action: 'retry',
  },
  timeout: {
    title: 'Location request timed out',
    body: 'Your device took too long to report a position. Stay on this screen and select Retry.',
    action: 'retry',
  },
  failed: {
    title: 'Location could not be read',
    body: 'Something went wrong while reading your location. Select Retry to try again.',
    action: 'retry',
  },
};

/**
 * Decides what the dialog does next, given what it already knows about the
 * environment and the browser's standing permission. Split out from the
 * component so the rule can be read and tested on its own.
 *
 * A blocker beats everything, because no permission can rescue a browser with
 * no Geolocation API or a page on plain HTTP. A denied permission is reported
 * rather than re-requested: browsers do not re-prompt, so calling
 * `getCurrentPosition` again would only reproduce the same failure. An
 * unresolved permission stops at an explanation on the automatic pass and goes
 * through to the prompt once the employee asks for it, so the prompt never
 * appears without a reason beside it. A granted permission, and a browser with
 * no Permissions API to ask, go straight to the position request.
 *
 * @param blocker - Environment failure found without asking the browser, or null.
 * @param permission - The browser's standing decision, or null when unreadable.
 * @param userInitiated - Whether this pass came from the employee's own click.
 */
export function nextLocationStep(
  blocker: LocationErrorKind | null,
  permission: PermissionState | null,
  userInitiated: boolean
): { status: 'detecting' } | { status: 'error'; kind: LocationErrorKind } {
  if (blocker) return { status: 'error', kind: blocker };
  if (permission === 'denied') {
    return { status: 'error', kind: 'permission-denied' };
  }
  if (permission === 'prompt' && !userInitiated) {
    return { status: 'error', kind: 'permission-required' };
  }
  return { status: 'detecting' };
}

/**
 * Whether the dialog has everything it needs from the browser to record an
 * event.
 *
 * A profile with `geolocationRequired` set has to have a position, because the
 * event is verified against the site the employee is standing on and there is
 * nothing to verify without coordinates. A profile without it only waits while
 * the attempt is still in flight, and goes ahead once the attempt has settled
 * one way or the other, so a refused or unavailable position stops being fatal
 * on the profiles that never asked for one. `idle` and `detecting` are both
 * still in flight.
 *
 * @param status - Where the location attempt has got to.
 * @param geolocationRequired - The effective profile's flag.
 */
export function isLocationSettled(
  status: LocationState['status'],
  geolocationRequired: boolean
): boolean {
  if (status === 'detected') return true;
  if (geolocationRequired) return false;
  return status === 'error';
}

/**
 * Metres between a position and a project's site, or null when the project
 * carries no coordinates and there is therefore nothing to measure against.
 */
function distanceToProject(
  location: GeoLocation,
  project: Project
): number | null {
  if (project.projectLatitude == null || project.projectLongitude == null) {
    return null;
  }
  return calculateDistance(location, {
    latitude: project.projectLatitude,
    longitude: project.projectLongitude,
  });
}

/**
 * The failure the page can determine on its own, before the browser is asked
 * for anything: no Geolocation API at all, or a page served over plain HTTP,
 * where every browser refuses geolocation regardless of the permission.
 */
function detectLocationBlocker(): LocationErrorKind | null {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return 'unsupported';
  }
  // Undefined on the server, where there is nothing to decide; only an explicit
  // false means the page really is on an origin the browser calls insecure.
  if (globalThis.isSecureContext === false) {
    return 'insecure';
  }
  return null;
}

/**
 * Reads the browser's standing decision for geolocation without asking for a
 * position, which is what lets the dialog tell "never asked" apart from
 * "blocked". Returns null where the Permissions API is missing or refuses the
 * query (older Safari, some in-app webviews); the caller then falls back to
 * asking for a position and reading the error code that comes back.
 */
async function readGeolocationPermission(): Promise<PermissionState | null> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return null;
  }
  try {
    const status = await navigator.permissions.query({
      name: 'geolocation' as PermissionName,
    });
    return status.state;
  } catch {
    return null;
  }
}

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
  // dialog's "just opened" state. `idle` and `detecting` render the same
  // spinner, and the effect below moves off `idle` once the permission has been
  // read, so nothing in the effect body has to setState synchronously.
  const [locationState, setLocationState] = useState<LocationState>(() => {
    const blocker = detectLocationBlocker();
    return blocker ? { status: 'error', kind: blocker } : { status: 'idle' };
  });
  const [projectMatch, setProjectMatch] = useState<ProjectMatch | null>(null);
  // The employee's own choice of project, which only exists on profiles that
  // do not require geolocation. Null means "whatever the position matched".
  const [pickedProjectId, setPickedProjectId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState('');

  const { data: projects = [], isPending: isLoadingProjects } =
    useProjectsByEmployee(employeeId);
  const { data: orgSettings } = useOrgSettings();

  const pickedProject =
    pickedProjectId == null
      ? null
      : (projects.find((p) => p.id === pickedProjectId) ?? null);
  // A manual choice wins over the nearest match, so the profile that governs
  // this check-in is the one attached to the project actually being recorded.
  const selectedProject = pickedProject ?? projectMatch?.project ?? null;

  const { data: projectSettings } = useProjectSettings(selectedProject?.id);
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
  // Measured against the project actually selected, so an override is checked
  // against the site it names rather than against the nearest one. Null when
  // there is no position, or the project carries no coordinates; either way
  // there is nothing to compare and the geofence does not apply.
  const selectedDistance =
    locationState.status === 'detected' && selectedProject
      ? distanceToProject(locationState.location, selectedProject)
      : null;
  const isWithinGeofence =
    selectedDistance !== null &&
    selectedDistance <= effectiveProfile.geofenceRadiusMeters;
  const isGeoBlocked =
    geolocationRequired && selectedDistance !== null && !isWithinGeofence;
  const locationSettled = isLocationSettled(
    locationState.status,
    geolocationRequired
  );
  // Offered when the profile does not require geolocation, since then nothing
  // derives the project from a position and the employee has to say which site
  // they are on. It stays on once used, so a choice whose own profile turns out
  // to require geolocation can still be changed back.
  const showProjectPicker = !geolocationRequired || pickedProjectId !== null;
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
          const distance = distanceToProject(location, project);
          if (distance === null) continue;
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
        let kind: LocationErrorKind = 'failed';
        switch (err.code) {
          case err.PERMISSION_DENIED: {
            kind = 'permission-denied';
            break;
          }
          case err.POSITION_UNAVAILABLE: {
            kind = 'position-unavailable';
            break;
          }
          case err.TIMEOUT: {
            kind = 'timeout';
            break;
          }
        }
        setLocationState({ status: 'error', kind });
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 }
    );
  }, [projects]);

  // The single entrypoint for mount, "Allow Location Access" and "Retry". It
  // reads the browser's standing decision first, so Retry re-checks the real
  // permission instead of blindly repeating a request the browser has already
  // settled, and so a first-time employee is told why we need their location
  // before the prompt appears rather than after.
  //
  // `userInitiated` is what separates those two: the mount pass stops at an
  // explanation, while a click carries the user gesture that should raise the
  // prompt. Every setState here happens after an await, keeping the effect
  // below free of a synchronous update.
  const applyLocationStep = useCallback(
    (step: ReturnType<typeof nextLocationStep>) => {
      setProjectMatch(null);
      setLocationState(step);
      if (step.status === 'detecting') {
        performLocationDetection();
      }
    },
    [performLocationDetection]
  );

  const resolveLocation = useCallback(
    (userInitiated: boolean) =>
      readGeolocationPermission().then((permission) => {
        applyLocationStep(
          nextLocationStep(detectLocationBlocker(), permission, userInitiated)
        );
      }),
    [applyLocationStep]
  );

  const handleAllowLocation = useCallback(() => {
    void resolveLocation(true);
  }, [resolveLocation]);

  const handleRetryLocation = useCallback(() => {
    void resolveLocation(true);
  }, [resolveLocation]);

  // Auto-resolve on mount, once the assigned projects have loaded. Waiting on
  // the query rather than on a non-empty list matters: an employee with no
  // assigned project used to leave this stuck on the spinner for ever, because
  // the old guard could not tell "still loading" from "none". The state update
  // happens in the Permissions API's callback, not in this body.
  useEffect(() => {
    if (locationState.status !== 'idle') return;
    if (isLoadingProjects) return;
    void resolveLocation(false);
  }, [locationState.status, isLoadingProjects, resolveLocation]);

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
    if (!selectedProject || !nextAction) return;

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
            projectId: selectedProject.id,
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
        description: `${selectedProject.projectName} · ${format(now, 'HH:mm')}`,
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
              <LocationStatus
                state={locationState}
                onAllow={handleAllowLocation}
                onRetry={handleRetryLocation}
              />
              {showProjectPicker && (
                <ProjectPicker
                  projects={projects}
                  isLoading={isLoadingProjects}
                  selectedId={selectedProject?.id ?? null}
                  onSelect={setPickedProjectId}
                  disabled={isPending}
                />
              )}
              {/* Beside the picker the card is a detail panel for whatever is
                  selected, and the picker states its own empty cases. Without
                  the picker it keeps its old job of reporting what the position
                  matched, including having matched nothing. */}
              {(showProjectPicker
                ? selectedProject !== null
                : locationState.status === 'detected') && (
                <ProjectMatchCard
                  project={selectedProject}
                  distance={selectedDistance}
                  isWithinGeofence={isWithinGeofence}
                  profile={liveProfile}
                  cycles={effectiveProfile.checkInOutCycles}
                />
              )}
            </div>

            {/* All done state */}
            {nextAction === null && selectedProject && (
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
                // A location is a precondition only for the profiles that ask
                // for one; everything else waits for the attempt to settle and
                // then goes ahead. A project is always a precondition, because
                // the event is recorded against one, but on a profile without
                // geolocation it comes from the picker rather than a position.
                disabled={
                  isPending ||
                  !locationSettled ||
                  !selectedProject ||
                  photoMissing
                }
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
  onAllow,
  onRetry,
}: {
  state: LocationState;
  onAllow: () => void;
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
    const copy = LOCATION_ERROR_COPY[state.kind];
    // 'permission-required' is a step in the flow rather than a fault, so it
    // reads as an amber prompt; everything else has actually failed.
    const isPrompt = state.kind === 'permission-required';
    return (
      <div
        className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${
          isPrompt
            ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
        }`}
      >
        {isPrompt ? (
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        ) : (
          <MapPinOff className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        )}
        <div className="flex-1 space-y-2">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{copy.title}</p>
            <p className="text-muted-foreground text-xs">{copy.body}</p>
          </div>
          {copy.action === 'allow' && (
            <Button size="sm" onClick={onAllow} className="h-7 text-xs">
              <MapPin className="mr-1 h-3 w-3" />
              Allow Location Access
            </Button>
          )}
          {copy.action === 'retry' && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-7 text-xs"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
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
  project,
  distance,
  isWithinGeofence,
  profile,
  cycles,
}: {
  project: Project | null;
  distance: number | null;
  isWithinGeofence: boolean;
  profile: AttendanceProfile | null | undefined;
  cycles: number;
}) {
  if (!project) {
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
            {project.projectName}
          </p>
          {project.projectAddress && (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {project.projectAddress}
            </p>
          )}
        </div>
        {/* No distance means no position, or a project with no coordinates.
            There is nothing to place the employee against, so the card reports
            neither "in range" nor a distance rather than implying one. */}
        {distance !== null &&
          (isWithinGeofence ? (
            <Badge className="shrink-0 bg-green-500 text-xs hover:bg-green-600">
              <CheckCircle className="mr-1 h-3 w-3" />
              In Range
            </Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0 text-xs">
              <AlertTriangle className="mr-1 h-3 w-3" />
              {formatDistance(distance)} away
            </Badge>
          ))}
      </div>
      <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {distance !== null && (
          <>
            <span>{formatDistance(distance)} from site</span>
            <span>·</span>
          </>
        )}
        <span>{cycles}-cycle day</span>
        <span>·</span>
        <span className={profile ? 'text-blue-600 dark:text-blue-400' : ''}>
          {profile ? profile.settingName : 'Default settings'}
        </span>
      </div>
    </div>
  );
}

// ─── Project picker ───────────────────────────────────────────────────────────

/**
 * Lets the employee name the site they are at, for the profiles where nothing
 * else can. When a position did arrive the nearest project is already
 * selected here, so this reads as an override rather than a blank form.
 */
function ProjectPicker({
  projects,
  isLoading,
  selectedId,
  onSelect,
  disabled,
}: {
  projects: Project[];
  isLoading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  disabled: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-muted/60 flex items-center gap-3 rounded-lg px-3 py-2.5">
        <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
        <p className="text-sm font-medium">Loading your projects…</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-900/20">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-medium">No projects assigned</p>
          <p className="text-muted-foreground text-xs">
            Attendance is recorded against a project. Ask your supervisor to
            assign you to one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor="att-project"
        className="flex items-center gap-1.5 text-sm"
      >
        <Building2 className="h-4 w-4" />
        Project
      </Label>
      <Select
        value={selectedId == null ? undefined : String(selectedId)}
        onValueChange={(v) => onSelect(Number(v))}
        disabled={disabled}
      >
        <SelectTrigger id="att-project" className="w-full">
          <SelectValue placeholder="Select your project site" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={String(project.id)}>
              {project.projectName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
