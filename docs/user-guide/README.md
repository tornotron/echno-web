# Echno user guide

This guide is for the people who run a construction business on Echno: site engineers, storekeepers,
purchase officers, project managers, HR and accounts staff. It describes what to do and what the
product does in response. It is not an API reference and not a developer onboarding document, and it
does not describe screens field by field. Where a rule is enforced somewhere the screen does not show
it, the guide says so.

## Where the other documentation lives

Four kinds of documentation exist for Echno and only one of them is this guide. Before adding
anything here, check whether it belongs in one of the others.

| You want                                             | Read                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| How to operate the product                           | This guide                                                                                             |
| The REST API, request and response shapes            | `echno-backend/docs/openapi.json`, generated from the controllers and verified in CI                   |
| Module-by-module API integration notes               | `echno-backend/docs/`, for example `ATTENDANCE_MODULE_USAGE_GUIDE.md` and `PROJECT_LEVEL_INVENTORY.md` |
| The shared TypeScript client contract                | `echno-core/etc/public-api.md` and the generated reference in `echno-core/docs/api/`                   |
| How the web client is built and how to work on it    | `echno-web/README.md` and `echno-web/docs/nextjs-codebase-walkthrough.md`                              |
| How an environment is deployed, restored or debugged | `echno-deployment/docs/runbooks/`                                                                      |

## What is written so far

This guide is being written module by module rather than as a thin outline of everything. One
complete chapter is more useful than ten stubs, so the table below is honest about what exists.

| Chapter                                               | Status      |
| ----------------------------------------------------- | ----------- |
| [Materials and inventory](materials-and-inventory.md) | Written     |
| Projects, WBS and tasks                               | Not written |
| Issues                                                | Not written |
| Inspections, compliance and NCRs                      | Not written |
| Attendance and regularization                         | Not written |
| Leave                                                 | Not written |
| Employees and invitations                             | Not written |
| Finance                                               | Not written |
| Third party: vendors, labour and sub-contracts        | Not written |
| Chat                                                  | Not written |
| Reports                                               | Not written |
| Administration and setup                              | Not written |

Each unwritten chapter is described at the bottom of this page, with the scope it should cover, so
someone can pick one up without re-deriving what belongs in it.

## Getting oriented

### Signing in

Echno signs you in through Keycloak, a separate sign-in service, rather than holding your password
itself. You are sent to the sign-in page, and once you are through you land back in the app.

The session ends after **29 minutes without activity**, not at a fixed time after you sign in. A
warning appears two minutes before that. Typing, clicking and scrolling all count as activity, and
activity in any tab counts for all your tabs, so a form left open in a background tab does not sign
you out while you work in the tab beside it.

### Your first organization

Everything in Echno belongs to an organization. Projects, materials, employees and stock balances are
all held per organization, and nothing crosses between them.

A user who signs up and belongs to no organization is sent to the onboarding page and asked to create
one. The person who creates an organization becomes its system administrator, and the organization is
seeded with a starting chart of accounts, budget cost categories and finance settings. It is **not**
seeded with leave policies, attendance settings or shift timings, so those are the first things an
administrator has to set up by hand.

Everyone else joins an existing organization rather than creating one. There are two ways in:

- An administrator generates an **invite code**, a five-digit number, and gives it to the person. They
  enter it at **Organizations > Join Organization**. The code carries a validity period, a maximum
  number of uses and a set of employee details that are pre-filled when it is redeemed. Nothing is
  emailed, so the code has to be passed on some other way.
- An administrator adds the person to the organization directly.

Joining an organization and being given a role are separate steps. Someone can be a member and hold no
role at all, which lets them see very little.

If you belong to more than one organization, the app works within one of them at a time and you choose
which. A user who belongs to exactly one organization never has to think about this.

### Roles

Roles are held per organization. Holding `system-admin` in one organization grants nothing in another.

| Role              | In practice                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `system-admin`    | Everything. Also the role that can approve a document it raised itself, where that is otherwise refused |
| `hr-admin`        | Employees, invite codes, organization details, attendance configuration, leave approvals                |
| `project-manager` | Projects, attendance records, inspections, stock adjustments                                            |
| `qa-engineer`     | Quality inspections, checklists, raising NCRs and signing off quality NCRs                              |
| `safety-officer`  | Safety inspections, raising NCRs and signing off safety NCRs                                            |
| `site-engineer`   | Reading inspections and reporting corrective action against an NCR                                      |
| `org-manager`     | Nothing yet. The role exists and can be assigned, but no part of the product grants it anything         |

Two things follow from how the roles are used:

- A quality engineer cannot sign off a safety non-conformance and a safety officer cannot sign off a
  quality one. Which of the two an NCR is comes from the inspection it was raised against.
- Much of the product is `system-admin` only. The whole procurement chain is, including simply reading
  it, which the materials chapter spells out.

A role change takes effect when you next sign in, because your roles are read from the sign-in token.

### Finding your way around

The sidebar groups the product into six sections:

| Section     | Holds                                                      |
| ----------- | ---------------------------------------------------------- |
| Overview    | Home, Chat                                                 |
| Projects    | Projects, and the tasks and issues inside them             |
| Inspections | QA/QC, Safety, NCR and Defects, Checklist Builder, Reports |
| Workforce   | Employees, My Leaves, Employee Leave, Attendance           |
| Operations  | Resources, Finance, Third Party                            |
| System      | Administration and settings                                |

The sidebar shows only what your role allows, and a section with nothing visible in it is dropped
entirely rather than shown empty. If a colleague describes a link you cannot see, the usual reason is
your role rather than a fault.

A few working pages are deliberately not in the sidebar and are reached from the record they belong
to, or by their address. **Stock Adjustments** is one of them, and the materials chapter says how to
get to it.

### Long forms remember what you typed

The long forms keep a local copy of what you have entered so a reload, a crash or a stray Back button
does not cost you twenty minutes of typing. When you return to the form it offers to restore the
draft, and you can restore it or discard it.

This applies to project, issue, task, purchase order, indent, goods receipt and site transfer forms.
Points worth knowing:

- The draft lives in your own browser, on that machine only. It does not reach the server and your
  colleagues never see it.
- It is kept for **24 hours** and then dropped.
- Editing record A and editing record B are separate drafts, and neither is the draft of a record you
  have not created yet.
- A draft is cleared once the record saves, so a completed record is never overwritten by an older
  draft.

### What the guide means by "approve"

Several documents in Echno do nothing until somebody approves them. A stock adjustment moves no stock
until it is approved. A purchase order is not an order until it is approved. The pattern is
deliberate, and the chapters say for each document what approving it actually causes.

Where an approval requires a second person, the person who raised the document cannot approve it. The
guide names the exception wherever one exists.

## Scope of the chapters still to write

**Projects, WBS and tasks.** Creating a project and what its approval sets off, the work breakdown
structure and how tasks hang off it, assigning and progressing tasks, the Gantt view, and the project
budget's relationship to the finance module.

**Issues.** Raising an issue against a project or a task, its lifecycle, assignment, and how issues
differ from NCRs raised out of an inspection.

**Inspections, compliance and NCRs.** Building a checklist, running an inspection against it,
QA/QC against Safety, and raising and closing an NCR. The chapter has to be clear that compliance
inspections are generated **only at the moment a project moves into approved**, so a project approved
before a rule for its state and project type existed never gets an inspection for that rule and never
will on its own. Regenerating for a project is a manual action, and it only adds what is missing.
Compliance rules are added by a database migration rather than through a screen.

**Attendance and regularization.** Marking attendance, the attendance settings an administrator
controls, attendance history, and raising and approving a regularization when a day was recorded
wrongly. Note when writing it that location is captured and can be made mandatory, but the geofence
radius is not currently enforced: nothing is rejected or flagged for being outside it.

**Leave.** Applying for leave, the balance and quota model, the approval queue, the leave calendar,
and the policies an administrator sets. The chapter has to state plainly that **leave is counted in
calendar days**: weekends and holidays inside a leave period are deducted like any other day, so a
Friday to Monday absence costs four days. There is no holiday calendar in the product. A new
organization also has no leave types until an administrator creates them.

**Employees and invitations.** Adding an employee, inviting a user, the relationship between a user
account and an employee record, and what happens to the records of an employee who leaves.

**Finance.** The chart of accounts, cost categories, project budgets, customer invoices and
receivables, vendor invoices and payables, payments and receipts, expenses, journal entries and
reversals, and the approval threshold in Finance Settings.

**Third party.** Vendors, labour and sub-contracts, and where each one is referenced from the
procurement and finance chapters.

**Chat.** Rooms, who can see them, and how messages arrive.

**Reports.** What each report covers, how it is filtered, and how it is exported.

**Administration and setup.** Roles and what each one can do, organization settings, approval
thresholds, and setting up a new organization from empty.
