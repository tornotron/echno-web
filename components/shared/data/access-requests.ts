import {
  AccessRequest,
  AccessRequestStatus,
  AccessRequestPriority,
  AccessRequestType,
} from '@/types/access-request';

// Helper to create dates relative to now
const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const hoursAgo = (hours: number): Date => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
};

const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export const mockAccessRequests: AccessRequest[] = [
  // Pending Requests - High Priority
  {
    id: 'ar-001',
    requesterId: '3',
    requesterName: 'Rajesh Kumar',
    requesterEmail: 'rajesh.kumar@echno.com',
    type: AccessRequestType.RESOURCE,
    resourceName: 'finance',
    resourceScope: 'manage',
    reason:
      'Need access to finance management to oversee project budgets and approve expenditures for the upcoming highway construction project.',
    businessJustification:
      'As Project Manager, I require finance management access to ensure proper budget allocation and cost control for the Rs. 500 Cr highway project starting next month.',
    priority: AccessRequestPriority.HIGH,
    requestedDuration: 'permanent',
    status: AccessRequestStatus.PENDING,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    submittedAt: daysAgo(2),
    comments: [],
  },
  {
    id: 'ar-002',
    requesterId: '4',
    requesterName: 'Priya Sharma',
    requesterEmail: 'priya.sharma@echno.com',
    type: AccessRequestType.MODULE,
    moduleName: 'WORKFORCE',
    reason:
      'Required to manage team assignments and resource allocation for the structural engineering division.',
    businessJustification:
      'With the new project workload, I need to coordinate workforce scheduling across multiple sites.',
    priority: AccessRequestPriority.URGENT,
    requestedDuration: 'permanent',
    status: AccessRequestStatus.PENDING,
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(6),
    submittedAt: hoursAgo(6),
    comments: [],
  },
  {
    id: 'ar-003',
    requesterId: '5',
    requesterName: 'Amit Patel',
    requesterEmail: 'amit.patel@echno.com',
    type: AccessRequestType.ROLE,
    roleName: 'site-supervisor',
    reason:
      'Promotion to Site Supervisor role requires updated system access permissions.',
    businessJustification:
      'Following performance review and promotion, need elevated access to supervise electrical work across multiple sites.',
    priority: AccessRequestPriority.HIGH,
    requestedDuration: 'permanent',
    status: AccessRequestStatus.PENDING,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    submittedAt: daysAgo(1),
    comments: [],
  },

  // Under Review
  {
    id: 'ar-004',
    requesterId: '6',
    requesterName: 'Sneha Reddy',
    requesterEmail: 'sneha.reddy@echno.com',
    type: AccessRequestType.RESOURCE,
    resourceName: 'reports',
    resourceScope: 'create',
    reason:
      'Need ability to generate and create custom reports for safety compliance documentation.',
    businessJustification:
      'Safety audits require detailed reporting capabilities to document inspections and incidents.',
    priority: AccessRequestPriority.NORMAL,
    requestedDuration: 'permanent',
    status: AccessRequestStatus.UNDER_REVIEW,
    assignedTo: '1',
    assignedToName: 'Admin User',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    submittedAt: daysAgo(5),
    comments: [
      {
        id: 'c-001',
        requestId: 'ar-004',
        authorId: '1',
        authorName: 'Admin User',
        content:
          'Reviewing this request. Can you clarify which specific report types you need to create?',
        createdAt: daysAgo(1),
        isInternal: false,
      },
    ],
  },
  {
    id: 'ar-005',
    requesterId: '7',
    requesterName: 'Vikram Singh',
    requesterEmail: 'vikram.singh@echno.com',
    type: AccessRequestType.MODULE,
    moduleName: 'INVENTORY',
    reason:
      'Require inventory module access to track equipment and materials for site operations.',
    businessJustification:
      'Managing equipment allocation across 3 active sites requires direct inventory system access.',
    priority: AccessRequestPriority.HIGH,
    requestedDuration: 'temporary',
    expiresAt: daysFromNow(90),
    status: AccessRequestStatus.UNDER_REVIEW,
    assignedTo: '2',
    assignedToName: 'Manager User',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
    submittedAt: daysAgo(3),
    comments: [],
  },

  // Approved Requests
  {
    id: 'ar-006',
    requesterId: '8',
    requesterName: 'Anita Desai',
    requesterEmail: 'anita.desai@echno.com',
    type: AccessRequestType.RESOURCE,
    resourceName: 'employee',
    resourceScope: 'view',
    reason:
      'Need view access to employee records for HR coordination and payroll processing.',
    businessJustification:
      'HR Assistant duties require read access to employee information.',
    priority: AccessRequestPriority.NORMAL,
    requestedDuration: 'permanent',
    status: AccessRequestStatus.APPROVED,
    reviewedBy: '1',
    reviewerName: 'Admin User',
    reviewedAt: daysAgo(2),
    reviewerComments:
      'Approved. Access granted for view-only employee records as per HR role requirements.',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(2),
    submittedAt: daysAgo(7),
    comments: [],
  },
  {
    id: 'ar-007',
    requesterId: '3',
    requesterName: 'Rajesh Kumar',
    requesterEmail: 'rajesh.kumar@echno.com',
    type: AccessRequestType.MODULE,
    moduleName: 'PROJECT',
    reason:
      'Project module access needed for comprehensive project tracking and milestone management.',
    businessJustification:
      'As Project Manager, this is essential for managing project timelines and deliverables.',
    priority: AccessRequestPriority.HIGH,
    requestedDuration: 'permanent',
    status: AccessRequestStatus.APPROVED,
    reviewedBy: '2',
    reviewerName: 'Manager User',
    reviewedAt: daysAgo(10),
    reviewerComments:
      'Approved. Project module access granted to support PM responsibilities.',
    createdAt: daysAgo(14),
    updatedAt: daysAgo(10),
    submittedAt: daysAgo(14),
    comments: [],
  },
  {
    id: 'ar-008',
    requesterId: '9',
    requesterName: 'Karthik Nair',
    requesterEmail: 'karthik.nair@echno.com',
    type: AccessRequestType.ROLE,
    roleName: 'quality-inspector',
    reason:
      'Role change from general worker to Quality Inspector following training completion.',
    businessJustification:
      'Completed QA certification. Need role update to perform inspection duties.',
    priority: AccessRequestPriority.NORMAL,
    requestedDuration: 'permanent',
    status: AccessRequestStatus.APPROVED,
    reviewedBy: '1',
    reviewerName: 'Admin User',
    reviewedAt: daysAgo(5),
    reviewerComments:
      'Training certificates verified. Role assignment approved.',
    createdAt: daysAgo(8),
    updatedAt: daysAgo(5),
    submittedAt: daysAgo(8),
    comments: [],
  },

  // Rejected Requests
  {
    id: 'ar-009',
    requesterId: '10',
    requesterName: 'Meera Joshi',
    requesterEmail: 'meera.joshi@echno.com',
    type: AccessRequestType.RESOURCE,
    resourceName: 'finance',
    resourceScope: 'delete',
    reason:
      'Requesting delete access to finance records for data cleanup tasks.',
    businessJustification:
      'Need to remove old duplicate entries from the system.',
    priority: AccessRequestPriority.LOW,
    requestedDuration: 'temporary',
    expiresAt: daysFromNow(30),
    status: AccessRequestStatus.REJECTED,
    reviewedBy: '1',
    reviewerName: 'Admin User',
    reviewedAt: daysAgo(3),
    reviewerComments:
      'Rejected. Delete access to finance records requires senior management approval and audit trail. Please submit through the Finance Department Head.',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(3),
    submittedAt: daysAgo(6),
    comments: [],
  },
  {
    id: 'ar-010',
    requesterId: '11',
    requesterName: 'Suresh Menon',
    requesterEmail: 'suresh.menon@echno.com',
    type: AccessRequestType.ROLE,
    roleName: 'system-admin',
    reason: 'Need system admin access to help with IT support tasks.',
    businessJustification: 'Want to assist the IT team with user management.',
    priority: AccessRequestPriority.NORMAL,
    requestedDuration: 'permanent',
    status: AccessRequestStatus.REJECTED,
    reviewedBy: '1',
    reviewerName: 'Admin User',
    reviewedAt: daysAgo(1),
    reviewerComments:
      'Rejected. System Admin role is restricted to designated IT personnel only. Your current role does not qualify for this level of access. Please work with IT for any support tasks.',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
    submittedAt: daysAgo(4),
    comments: [],
  },

  // Draft Requests
  {
    id: 'ar-011',
    requesterId: '4',
    requesterName: 'Priya Sharma',
    requesterEmail: 'priya.sharma@echno.com',
    type: AccessRequestType.RESOURCE,
    resourceName: 'project',
    resourceScope: 'update',
    reason: 'Need to update project documentation and schedules.',
    priority: AccessRequestPriority.NORMAL,
    requestedDuration: 'permanent',
    status: AccessRequestStatus.DRAFT,
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(2),
    comments: [],
  },

  // Cancelled Request
  {
    id: 'ar-012',
    requesterId: '12',
    requesterName: 'Arun Verma',
    requesterEmail: 'arun.verma@echno.com',
    type: AccessRequestType.MODULE,
    moduleName: 'ADMIN',
    reason: 'Requested admin module for system configuration.',
    businessJustification: 'Needed for temporary project setup.',
    priority: AccessRequestPriority.HIGH,
    requestedDuration: 'temporary',
    expiresAt: daysFromNow(30),
    status: AccessRequestStatus.CANCELLED,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(8),
    submittedAt: daysAgo(10),
    comments: [],
  },

  // Expired Request
  {
    id: 'ar-013',
    requesterId: '5',
    requesterName: 'Amit Patel',
    requesterEmail: 'amit.patel@echno.com',
    type: AccessRequestType.RESOURCE,
    resourceName: 'equipment',
    resourceScope: 'manage',
    reason:
      'Temporary equipment management access for site relocation project.',
    businessJustification:
      'Required for coordinating equipment transfers during site move.',
    priority: AccessRequestPriority.NORMAL,
    requestedDuration: 'temporary',
    expiresAt: daysAgo(5),
    status: AccessRequestStatus.EXPIRED,
    reviewedBy: '2',
    reviewerName: 'Manager User',
    reviewedAt: daysAgo(30),
    reviewerComments: 'Approved for 30 days during site relocation.',
    createdAt: daysAgo(35),
    updatedAt: daysAgo(5),
    submittedAt: daysAgo(35),
    comments: [],
  },

  // More Pending for pagination demo
  {
    id: 'ar-014',
    requesterId: '13',
    requesterName: 'Deepa Krishnan',
    requesterEmail: 'deepa.krishnan@echno.com',
    type: AccessRequestType.RESOURCE,
    resourceName: 'documents',
    resourceScope: 'create',
    reason:
      'Need to create and upload project documentation for compliance records.',
    businessJustification:
      'ISO audit preparation requires document creation capabilities.',
    priority: AccessRequestPriority.HIGH,
    requestedDuration: 'permanent',
    status: AccessRequestStatus.PENDING,
    createdAt: hoursAgo(12),
    updatedAt: hoursAgo(12),
    submittedAt: hoursAgo(12),
    comments: [],
  },
  {
    id: 'ar-015',
    requesterId: '14',
    requesterName: 'Rahul Gupta',
    requesterEmail: 'rahul.gupta@echno.com',
    type: AccessRequestType.MODULE,
    moduleName: 'FINANCE',
    reason:
      'Finance module required for expense tracking and reimbursement processing.',
    businessJustification:
      'Taking over finance coordinator duties from next week.',
    priority: AccessRequestPriority.NORMAL,
    requestedDuration: 'permanent',
    status: AccessRequestStatus.PENDING,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    submittedAt: daysAgo(1),
    comments: [],
  },
  {
    id: 'ar-016',
    requesterId: '15',
    requesterName: 'Lakshmi Iyer',
    requesterEmail: 'lakshmi.iyer@echno.com',
    type: AccessRequestType.ROLE,
    roleName: 'accountant',
    reason: 'Role upgrade needed after completing CA certification.',
    businessJustification:
      'Promotion to Accountant position effective next month.',
    priority: AccessRequestPriority.NORMAL,
    requestedDuration: 'permanent',
    status: AccessRequestStatus.PENDING,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    submittedAt: daysAgo(3),
    comments: [],
  },
];

// Helper functions to filter mock data
export function getAccessRequestsByStatus(
  status: AccessRequestStatus
): AccessRequest[] {
  return mockAccessRequests.filter((req) => req.status === status);
}

export function getAccessRequestsByUserId(userId: string): AccessRequest[] {
  return mockAccessRequests.filter((req) => req.requesterId === userId);
}

export function getPendingRequestsCount(): number {
  return mockAccessRequests.filter(
    (req) =>
      req.status === AccessRequestStatus.PENDING ||
      req.status === AccessRequestStatus.UNDER_REVIEW
  ).length;
}

export function getUrgentRequestsCount(): number {
  return mockAccessRequests.filter(
    (req) =>
      (req.status === AccessRequestStatus.PENDING ||
        req.status === AccessRequestStatus.UNDER_REVIEW) &&
      (req.priority === AccessRequestPriority.HIGH ||
        req.priority === AccessRequestPriority.URGENT)
  ).length;
}
