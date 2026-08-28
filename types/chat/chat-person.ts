// types/chat/chat-person.ts

import { Employee, EmployeeLookup } from '@tornotron/echno-core/employee/types';

/**
 * The person behind a chat participant or a message sender, as chat renders them.
 *
 * Chat needs a directory of everyone in the tenant to put a name against a participant
 * id, and it needs it on every page, because the floating chat is mounted in the
 * dashboard shell. The full employee record is the wrong source for that: it carries
 * contact details, salary and personal data, so the backend restricts
 * `GET /employee/web` to system-admin, hr-admin and project-manager. Reading it here
 * meant every member without one of those roles got a 403 on every page load, and
 * every member with one downloaded the tenant's personnel file to render a name.
 *
 * So chat reads the member-safe projection instead (`GET /employee/web/lookup`, any
 * tenant member), and this type is the shape both sources satisfy: `EmployeeLookup`
 * supplies the identity and the name, while the two fields below are the extras that
 * only the full {@link Employee} record carries. They stay optional because the
 * lookup does not return them, and the components that read them already fall back
 * (an avatar to initials, an email to nothing). The current user's own record still
 * arrives in full via `useUserEmployees`, so their avatar survives.
 */
export type ChatPerson = EmployeeLookup & {
  /** Only on the full {@link Employee} record; absent on the lookup projection. */
  email?: string;
  /** Only on the full {@link Employee} record; absent on the lookup projection. */
  profilePicture?: Employee['profilePicture'];
};
