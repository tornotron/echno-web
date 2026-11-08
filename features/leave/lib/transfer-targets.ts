/**
 * Who a leave approver may transfer a request to.
 *
 * A leave request goes to the employee's immediate manager alone, who either
 * decides it or hands it to a manager above them when a more senior decision
 * is needed (ClickUp 14zdkkvzx68). The backend accepts only someone in the
 * approver's own reporting line above them, up to five levels, and refuses
 * anyone else. This lists the same people, so the picker never offers a name
 * the server would turn down.
 */

/** The fields this needs from an employee record. */
export interface ReportingLineMember {
  id?: number;
  managerId?: number;
}

/** How far up the line the backend walks. */
const MAX_LEVELS = 5;

/**
 * The managers above `approver`, nearest first.
 *
 * @param approver - The signed-in approver's employee record.
 * @param managers - Every employee who manages someone, the list the picker
 *   draws from. A manager missing from it ends the walk there.
 * @returns The managers above the approver, in order, without repeats.
 */
export function managersAbove<T extends ReportingLineMember>(
  approver: ReportingLineMember | undefined,
  managers: readonly T[]
): T[] {
  const byId = new Map<number, T>();
  for (const manager of managers) {
    if (manager.id !== undefined) byId.set(manager.id, manager);
  }

  const line: T[] = [];
  const seen = new Set<number>();
  if (approver?.id !== undefined) seen.add(approver.id);

  let nextId = approver?.managerId;
  while (
    nextId !== undefined &&
    line.length < MAX_LEVELS &&
    !seen.has(nextId)
  ) {
    const manager = byId.get(nextId);
    if (!manager) break;
    line.push(manager);
    seen.add(nextId);
    nextId = manager.managerId;
  }
  return line;
}
