/**
 * The clock-events timeline shows where a punch was taken, and does not claim
 * whether that place was acceptable.
 *
 * The distinction matters because the server does not evaluate the geofence.
 * `isWithinGeofence` and `distanceFromProject` are written as a fixed `false`
 * and `0.0` at every clock-event construction site, so a card that rendered
 * them told every employee they had punched in from outside the site, and told
 * their manager the same thing. Both values are also the wrong way round from
 * each other: zero metres from the project, yet outside a hundred-metre fence.
 *
 * The browser does check the geofence before a punch is accepted, in the
 * marking dialog, which is why this went unnoticed. That check is a live
 * comparison against the employee's current position and is unrelated to what
 * these tests cover, which is the read-back of a stored record.
 *
 * See tornotron/echno-backend#646 for the server side. A verdict belongs here
 * again only once the server computes one, and it needs a third state for the
 * records written before it did.
 */
import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { render } from '@testing-library/react';
import type { Attendance } from '@tornotron/echno-core/attendance/types';

const { AttendanceClockEventsCard } =
  await import('./attendance-clock-events-card');

/**
 * A punch taken 9.66 m from the project marker, which is the real staging
 * record. It is comfortably inside the configured 100 m radius, and the server
 * stored it as `isWithinGeofence: false` with `distanceFromProject: 0`. The
 * card must not repeat either claim.
 */
const attendance = {
  id: 41,
  employeeId: 12,
  employeeName: 'Priya Nair',
  projectId: 3,
  projectName: 'Riverside Tower',
  morningClockIn: {
    id: 1,
    timestamp: new Date('2026-08-31T09:04:00'),
    location: {
      latitude: 10.028_173_252_364_484,
      longitude: 76.878_795_697_762_95,
    },
    isWithinGeofence: false,
    distanceFromProject: 0,
    deviceInfo: { platform: 'Android', deviceId: 'abc' },
  },
} as unknown as Attendance;

describe('the clock-events timeline', () => {
  test('states no geofence verdict, because the server computes none', () => {
    const { container } = render(
      createElement(AttendanceClockEventsCard, { attendance })
    );
    const text = container.textContent ?? '';

    expect(text).not.toContain('Outside Geofence');
    expect(text).not.toContain('Within Geofence');
    expect(text.toLowerCase()).not.toContain('geofence');
  });

  test('does not report a distance from the project', () => {
    const { container } = render(
      createElement(AttendanceClockEventsCard, { attendance })
    );
    const text = container.textContent ?? '';

    // The stored value is a constant 0, so "0m from project" would assert the
    // employee stood exactly on the site marker.
    expect(text).not.toContain('from project');
    expect(text).not.toContain('0m');
  });

  test('still shows the captured coordinates, which are real', () => {
    const { container } = render(
      createElement(AttendanceClockEventsCard, { attendance })
    );
    const text = container.textContent ?? '';

    // Dropping the verdict must not drop the evidence it was pretending to
    // summarise: the position is genuinely recorded and stays on the card.
    expect(text).toContain('10.028173');
    expect(text).toContain('76.878796');
    expect(text).toContain('Location');
  });
});
