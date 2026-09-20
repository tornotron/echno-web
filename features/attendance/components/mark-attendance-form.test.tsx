/**
 * Mark for Team: a tick has to reach the action button, and the supervisor's
 * own position has to reach the request.
 *
 * ClickUp 86d45jzpa reported "Mark Clock-In (0 selected)" after ticking
 * EMP-0004 and a run that reported "Clock-in marked for 0 employee(s)". The
 * count came from the selection being cleared after a run in which every
 * request was refused for the missing selfie or coordinates, which are on by
 * default. The rule is now that a subordinate owes no selfie when a supervisor
 * marks them, and the supervisor's position is sent and measured instead
 * (echno-backend#839), so the screen no longer blocks on the selfie flag, and
 * a tick that only Clock-Out will count is explained rather than silent.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import * as realAttendanceHooks from '@tornotron/echno-core/attendance/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';
import * as realSettingsHooks from '@tornotron/echno-core/attendance-settings/hooks';
import * as realShiftHooks from '@tornotron/echno-core/shift-timing/hooks';

type Member = {
  id: number;
  name: string;
  employeeId: string;
  designation?: string;
};

const members: Member[] = [
  { id: 4, name: 'Ravi Kumar', employeeId: 'EMP-0004', designation: 'Mason' },
  { id: 5, name: 'Priya Nair', employeeId: 'EMP-0005' },
];

let attendanceRows: unknown[] = [];
let settings: Record<string, unknown> | undefined;
const checkIn = mock(async (_req: unknown) => ({}));
const recordClockEvent = mock(async (_req: unknown) => ({}));

// The browser's position, as the shared location flow reads it. Granted and
// on site, so the flow settles on `detected` without a prompt.
const POSITION = { latitude: 13.082_75, longitude: 80.270_75, accuracy: 8 };
Object.defineProperty(globalThis.navigator, 'geolocation', {
  configurable: true,
  value: {
    getCurrentPosition: (ok: (pos: unknown) => void) =>
      ok({ coords: { ...POSITION, altitude: null } }),
  },
});
Object.defineProperty(globalThis.navigator, 'permissions', {
  configurable: true,
  value: { query: async () => ({ state: 'granted' }) },
});

mock.module('@tornotron/echno-core/project/hooks', () => ({
  ...realProjectHooks,
  useProjects: () => ({
    data: [{ id: 3, projectName: 'Riverside Tower' }],
    isLoading: false,
  }),
  useEmployeesByProject: (projectId?: number) => ({
    data: projectId ? members : [],
    isLoading: false,
  }),
}));

mock.module('@tornotron/echno-core/attendance-settings/hooks', () => ({
  ...realSettingsHooks,
  useOrgSettings: () => ({ data: settings }),
  useProjectSettings: () => ({ data: undefined }),
}));

mock.module('@tornotron/echno-core/shift-timing/hooks', () => ({
  ...realShiftHooks,
  useShifts: () => ({ data: [{ id: 1 }] }),
}));

mock.module('@tornotron/echno-core/attendance/hooks', () => ({
  ...realAttendanceHooks,
  useAttendanceByProject: () => ({
    data: { content: attendanceRows },
    isLoading: false,
  }),
  useCheckIn: () => ({ mutateAsync: checkIn, isPending: false }),
  useRecordClockEvent: () => ({
    mutateAsync: recordClockEvent,
    isPending: false,
  }),
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    success: () => {},
    warning: () => {},
    error: () => {},
  },
}));

const { MarkAttendanceForm } = await import('./mark-attendance-form');

afterEach(() => {
  cleanup();
  attendanceRows = [];
  settings = undefined;
  checkIn.mockClear();
  recordClockEvent.mockClear();
});

function renderWithProject() {
  return render(createElement(MarkAttendanceForm, { initialProjectId: 3 }));
}

function buttonLabelled(view: ReturnType<typeof render>, label: string) {
  return [...view.container.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(label)
  )!;
}

describe('ticking a team member', () => {
  test('counts an unmarked member on the clock-in button', () => {
    const view = renderWithProject();
    expect(buttonLabelled(view, 'Mark Clock-In').textContent).toContain(
      '(0 selected)'
    );

    fireEvent.click(view.getByLabelText('Select Ravi Kumar'));

    expect(buttonLabelled(view, 'Mark Clock-In').textContent).toContain(
      '(1 selected)'
    );
    expect(buttonLabelled(view, 'Mark Clock-In')).not.toBeDisabled();
  });

  test('counts a clocked-in member on the clock-out button, and says so', () => {
    attendanceRows = [
      {
        id: 41,
        employeeId: 4,
        status: 'pending_regularization',
        morningClockIn: { timestamp: new Date('2026-09-20T09:00:00') },
      },
    ];
    const view = renderWithProject();
    fireEvent.click(view.getByLabelText('Select Ravi Kumar'));

    // The ticket's screen: Clock-In reads 0 because the tick belongs to
    // Clock-Out. The note is what stops that reading as a lost selection.
    expect(buttonLabelled(view, 'Mark Clock-In').textContent).toContain(
      '(0 selected)'
    );
    expect(buttonLabelled(view, 'Mark Clock-Out').textContent).toContain(
      '(1 selected)'
    );
    expect(view.getByTestId('selection-note').textContent).toContain(
      'already clocked in, so only Clock-Out applies'
    );
  });
});

describe('the selfie rule and the supervisor position', () => {
  test('a project that requires a selfie no longer blocks the screen', async () => {
    // Before echno-backend#839 this alert disabled both buttons on the
    // default settings, which is where the "0 employee(s)" run came from.
    settings = { photoRequiredOnCheckIn: true, geolocationRequired: true };
    const view = renderWithProject();
    await waitFor(() =>
      expect(view.container.textContent).not.toContain('Reading your location')
    );
    fireEvent.click(view.getByLabelText('Select Ravi Kumar'));

    expect(view.container.textContent).not.toContain('Bulk marking is blocked');
    expect(buttonLabelled(view, 'Mark Clock-In')).not.toBeDisabled();
  });

  test('the supervisor position travels with every request', async () => {
    settings = { photoRequiredOnCheckIn: true, geolocationRequired: true };
    const view = renderWithProject();
    await waitFor(() =>
      expect(view.container.textContent).not.toContain('Reading your location')
    );
    fireEvent.click(view.getByLabelText('Select Ravi Kumar'));
    fireEvent.click(buttonLabelled(view, 'Mark Clock-In'));

    await waitFor(() => expect(checkIn).toHaveBeenCalledTimes(1));
    const request = checkIn.mock.calls[0][0] as { location?: typeof POSITION };
    expect(request.location).toMatchObject(POSITION);
  });

  test('the fence refusal from the server is what the operator reads', async () => {
    settings = { geolocationRequired: true };
    const refusal =
      'You are 256 m from the project site, outside the 100 m site boundary.';
    checkIn.mockImplementationOnce(async () => {
      throw new Error(refusal);
    });
    const view = renderWithProject();
    await waitFor(() =>
      expect(view.container.textContent).not.toContain('Reading your location')
    );
    fireEvent.click(view.getByLabelText('Select Ravi Kumar'));
    fireEvent.click(buttonLabelled(view, 'Mark Clock-In'));

    await waitFor(() => expect(checkIn).toHaveBeenCalledTimes(1));
    // A refused member stays ticked for a retry once the operator is on site.
    await waitFor(() =>
      expect(buttonLabelled(view, 'Mark Clock-In').textContent).toContain(
        '(1 selected)'
      )
    );
  });
});
