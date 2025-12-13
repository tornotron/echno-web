// lib/comprehensive-mock-data.ts
// Comprehensive mock data for all types in the application

import { Employee, EmployeeStatus, Department } from '@/types/employee';
import { Organization } from '@/types/organization';
import { Project, ProjectStatus } from '@/types/project';
import { Task, TaskStatus, WorkCategory } from '@/types/task';
import { Issue, IssueStatus, IssueType, IssueComment } from '@/types/issue';
import { Invitation } from '@/types/invitation';
import { Member } from '@/types/member';
import {
  Attendance,
  AttendanceStatus,
  AttendanceSummary,
  ShiftTiming,
  ClockEvent,
  ClockEventType,
  GeoLocation,
  MovementType,
} from '@/types/attendance';
import {
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  EmployeeLeaveQuota,
  LeaveBalance,
  QuotaPeriod,
} from '@/types/leave';

import { Location, LocationType } from '@/types/resource/location';
import { InventoryItem } from '@/types/resource/inventory';
import { Asset, AssetLocationHistory } from '@/types/resource/asset';
import { PurchaseOrder, PurchaseOrderLineItem, PurchaseOrderType, PurchaseOrderStatus, DeliveryStatus } from '@/types/resource/purchase-order';
import { MaterialRequest, MaterialRequestLineItem, MaterialRequestStatus, MaterialRequestPriority, MaterialRequestType, FulfillmentMethod } from '@/types/resource/material-request';
import { Transfer, TransferType, TransferStatus, TransferPriority } from '@/types/resource/transfer';

// ═════════════════════════════════════════════════════════════════════════════
// 1. USERS
// ═════════════════════════════════════════════════════════════════════════════

import { mockUsers } from './data/users';

// ═════════════════════════════════════════════════════════════════════════════
// 2. ORGANIZATIONS
// ═════════════════════════════════════════════════════════════════════════════

import { mockOrganizations } from './data/organizations';

// ═════════════════════════════════════════════════════════════════════════════
// 3. EMPLOYEES
// ═════════════════════════════════════════════════════════════════════════════

import { mockEmployees } from './data/employees';

// ═════════════════════════════════════════════════════════════════════════════
// 4. MEMBERS (For Projects)
// ═════════════════════════════════════════════════════════════════════════════

const mockMembers: Member[] = [
  {
    id: 1,
    memberName: 'Rajesh Kumar',
    memberEmail: 'rajesh.kumar@echno.com',
    memberPhone: '+91 98765 43210',
    memberRole: 'projectManager',
    department: 'Engineering',
    designation: 'Senior Project Manager',
    memberImage: '/avatars/rajesh.jpg',
  },
  {
    id: 2,
    memberName: 'Priya Sharma',
    memberEmail: 'priya.sharma@echno.com',
    memberPhone: '+91 87654 32109',
    memberRole: 'civilEngineer',
    department: 'Engineering',
    designation: 'Structural Engineer',
    memberImage: '/avatars/priya.jpg',
  },
  {
    id: 3,
    memberName: 'Amit Patel',
    memberEmail: 'amit.patel@echno.com',
    memberPhone: '+91 76543 21098',
    memberRole: 'electrician',
    department: 'Engineering',
    designation: 'Senior Electrician',
    memberImage: '/avatars/amit.jpg',
  },
  {
    id: 5,
    memberName: 'Vikram Singh',
    memberEmail: 'vikram.singh@echno.com',
    memberPhone: '+91 54321 09876',
    memberRole: 'plumber',
    department: 'Construction',
    designation: 'Lead Plumber',
    memberImage: '/avatars/vikram.jpg',
  },
  {
    id: 6,
    memberName: 'Anjali Verma',
    memberEmail: 'anjali.verma@echno.com',
    memberPhone: '+91 43210 98765',
    memberRole: 'safetyOfficer',
    department: 'Safety',
    designation: 'Safety Officer',
    memberImage: '/avatars/anjali.jpg',
  },
  {
    id: 7,
    memberName: 'Karan Mehta',
    memberEmail: 'karan.mehta@echno.com',
    memberPhone: '+91 32109 87654',
    memberRole: 'architect',
    department: 'Engineering',
    designation: 'Lead Architect',
    memberImage: '/avatars/karan.jpg',
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 5. WORK CATEGORIES
// ═════════════════════════════════════════════════════════════════════════════

const mockWorkCategories: WorkCategory[] = [
  {
    id: 1,
    name: 'Civil Works',
    description: 'Foundation, structural work, concrete pouring',
    icon: 'CW',
    image: '/categories/civil.jpg',
  },
  {
    id: 2,
    name: 'Electrical Installation',
    description: 'Wiring, lighting, electrical systems',
    icon: 'EI',
    image: '/categories/electrical.jpg',
  },
  {
    id: 3,
    name: 'Plumbing & Drainage',
    description: 'Water supply, drainage, sanitary systems',
    icon: 'PD',
    image: '/categories/plumbing.jpg',
  },
  {
    id: 4,
    name: 'HVAC',
    description: 'Heating, ventilation, and air conditioning',
    icon: 'HV',
    image: '/categories/hvac.jpg',
  },
  {
    id: 5,
    name: 'Finishing Works',
    description: 'Painting, tiling, flooring, false ceiling',
    icon: 'FW',
    image: '/categories/finishing.jpg',
  },
  {
    id: 6,
    name: 'Structural Steel',
    description: 'Steel erection, welding, fabrication',
    icon: 'SS',
    image: '/categories/steel.jpg',
  },
  {
    id: 7,
    name: 'Landscaping',
    description: 'Outdoor works, gardens, paving',
    icon: 'LS',
    image: '/categories/landscaping.jpg',
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 6. ISSUE COMMENTS
// ═════════════════════════════════════════════════════════════════════════════

const mockIssueComments: IssueComment[] = [
  {
    id: 1,
    comment: 'This needs immediate attention. The crack is spreading.',
    author: 'Priya Sharma',
    createdAt: new Date('2025-01-12T10:30:00'),
  },
  {
    id: 2,
    comment: 'I have inspected the site. It appears to be a structural issue.',
    author: 'Rajesh Kumar',
    createdAt: new Date('2025-01-12T14:15:00'),
  },
  {
    id: 3,
    comment: 'Contractor has been notified. Will fix by EOD tomorrow.',
    author: 'Anjali Verma',
    createdAt: new Date('2025-01-13T09:00:00'),
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 7. ISSUES
// ═════════════════════════════════════════════════════════════════════════════

const mockIssues: Issue[] = [
  {
    id: 1,
    title: 'Crack in foundation wall near column C3',
    description:
      'A hairline crack has been observed in the foundation wall near column C3. Requires immediate structural assessment.',
    type: IssueType.technical,
    status: IssueStatus.inProgress,
    createdAt: new Date('2025-01-12T08:00:00'),
    updatedAt: new Date('2025-01-13T09:00:00'),
    creator: 'Priya Sharma',
    comments: mockIssueComments.slice(0, 3),
  },
  {
    id: 2,
    title: 'Electrical panel not meeting specifications',
    description:
      'The installed electrical panel does not match the approved specifications in the design documents.',
    type: IssueType.design,
    status: IssueStatus.open,
    createdAt: new Date('2025-01-10T11:30:00'),
    updatedAt: new Date('2025-01-10T11:30:00'),
    creator: 'Amit Patel',
    comments: [],
  },
  {
    id: 3,
    title: 'Poor quality concrete in slab',
    description:
      'Visual inspection reveals honeycombing and segregation in the concrete slab at Level 3.',
    type: IssueType.quality,
    status: IssueStatus.pending,
    createdAt: new Date('2025-01-08T15:20:00'),
    updatedAt: new Date('2025-01-09T10:00:00'),
    creator: 'Rajesh Kumar',
    comments: [],
  },
  {
    id: 4,
    title: 'Missing safety barriers on 4th floor',
    description:
      'Safety barriers are not installed on the 4th floor perimeter. This is a critical safety violation.',
    type: IssueType.safety,
    status: IssueStatus.resolved,
    createdAt: new Date('2025-01-05T08:00:00'),
    updatedAt: new Date('2025-01-07T17:00:00'),
    creator: 'Anjali Verma',
    comments: [],
  },
  {
    id: 5,
    title: 'Delay in steel delivery',
    description:
      'Structural steel shipment delayed by 2 weeks due to supplier issues.',
    type: IssueType.material,
    status: IssueStatus.blocked,
    createdAt: new Date('2025-01-03T09:00:00'),
    updatedAt: new Date('2025-01-05T14:00:00'),
    creator: 'Rajesh Kumar',
    comments: [],
  },
  {
    id: 6,
    title: 'Crane breakdown',
    description:
      'Tower crane experienced mechanical failure. Repair estimated to take 3-4 days.',
    type: IssueType.equipment,
    status: IssueStatus.inReview,
    createdAt: new Date('2025-01-11T13:45:00'),
    updatedAt: new Date('2025-01-12T08:30:00'),
    creator: 'Site Supervisor',
    comments: [],
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 8. TASKS
// ═════════════════════════════════════════════════════════════════════════════

const mockTasks: Task[] = [
  {
    id: 1,
    projectId: 1,
    title: 'Foundation Excavation',
    startDate: new Date('2025-01-05'),
    endDate: new Date('2025-01-20'),
    creator: mockMembers[0],
    assignees: [mockMembers[0], mockMembers[1]],
    category: mockWorkCategories[0],
    progress: 75,
    tags: ['urgent', 'foundation', 'civil'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-14'),
    status: TaskStatus.onGoing,
    issues: [mockIssues[0]],
  },
  {
    id: 2,
    projectId: 1,
    title: 'Electrical Panel Installation - Level 1',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-01-28'),
    creator: mockMembers[0],
    assignees: [mockMembers[2]],
    category: mockWorkCategories[1],
    progress: 40,
    tags: ['electrical', 'installation'],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-14'),
    status: TaskStatus.onGoing,
    issues: [mockIssues[1]],
  },
  {
    id: 3,
    projectId: 1,
    title: 'Plumbing Rough-in - Levels 1-3',
    startDate: new Date('2025-01-20'),
    endDate: new Date('2025-02-05'),
    creator: mockMembers[0],
    assignees: [mockMembers[3]],
    category: mockWorkCategories[2],
    progress: 0,
    tags: ['plumbing', 'rough-in'],
    createdAt: new Date('2025-01-12'),
    updatedAt: new Date('2025-01-12'),
    status: TaskStatus.upcoming,
    issues: [],
  },
  {
    id: 4,
    projectId: 1,
    title: 'Concrete Slab Pouring - Level 3',
    startDate: new Date('2025-01-08'),
    endDate: new Date('2025-01-15'),
    creator: mockMembers[0],
    assignees: [mockMembers[1]],
    category: mockWorkCategories[0],
    progress: 100,
    tags: ['concrete', 'structural', 'completed'],
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-15'),
    status: TaskStatus.completed,
    issues: [mockIssues[2]],
  },
  {
    id: 5,
    projectId: 1,
    title: 'Safety Barrier Installation',
    startDate: new Date('2025-01-05'),
    endDate: new Date('2025-01-07'),
    creator: mockMembers[4],
    assignees: [mockMembers[4]],
    category: mockWorkCategories[0],
    progress: 100,
    tags: ['safety', 'urgent', 'completed'],
    createdAt: new Date('2025-01-04'),
    updatedAt: new Date('2025-01-07'),
    status: TaskStatus.completed,
    issues: [mockIssues[3]],
  },
  {
    id: 6,
    projectId: 1,
    title: 'Structural Steel Erection',
    startDate: new Date('2025-01-25'),
    endDate: new Date('2025-02-15'),
    creator: mockMembers[0],
    assignees: [mockMembers[1]],
    category: mockWorkCategories[5],
    progress: 0,
    tags: ['steel', 'structural', 'on-hold'],
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-05'),
    status: TaskStatus.onHold,
    issues: [mockIssues[4]],
  },
  {
    id: 7,
    projectId: 2,
    title: 'HVAC System Installation',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-02-20'),
    creator: mockMembers[0],
    assignees: [mockMembers[2]],
    category: mockWorkCategories[3],
    progress: 0,
    tags: ['hvac', 'mechanical'],
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    status: TaskStatus.upcoming,
    issues: [],
  },
  {
    id: 8,
    projectId: 2,
    title: 'Interior Painting - Residential Units',
    startDate: new Date('2025-02-10'),
    endDate: new Date('2025-03-05'),
    creator: mockMembers[0],
    assignees: [mockMembers[1], mockMembers[3]],
    category: mockWorkCategories[4],
    progress: 0,
    tags: ['finishing', 'painting'],
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-01-20'),
    status: TaskStatus.upcoming,
    issues: [],
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 9. PROJECTS
// ═════════════════════════════════════════════════════════════════════════════

const mockProjects: Project[] = [
  {
    id: 1,
    projectName: 'Sunrise Tower',
    projectAddress: 'Plot No. 23, Bandra West, Mumbai, Maharashtra 400050',
    status: ProjectStatus.open,
    projectLongitude: 72.8347,
    projectLatitude: 19.0607,
    startDate: new Date('2024-12-01'),
    endDate: new Date('2026-11-30'),
    createdAt: new Date('2024-11-01'),
    members: mockMembers.slice(0, 4),
    tasks: mockTasks.filter((t) => t.projectId === 1),
  },
  {
    id: 2,
    projectName: 'Green Valley Residential Complex',
    projectAddress: 'Whitefield Main Road, Bangalore, Karnataka 560066',
    status: ProjectStatus.open,
    projectLongitude: 77.7499,
    projectLatitude: 12.9698,
    startDate: new Date('2025-01-15'),
    endDate: new Date('2027-01-14'),
    createdAt: new Date('2024-12-10'),
    members: mockMembers,
    tasks: mockTasks.filter((t) => t.projectId === 2),
  },
  {
    id: 3,
    projectName: 'Metro Station - Sector 18',
    projectAddress: 'Sector 18, Noida, Uttar Pradesh 201301',
    status: ProjectStatus.upcoming,
    projectLongitude: 77.326,
    projectLatitude: 28.5688,
    startDate: new Date('2025-03-01'),
    endDate: new Date('2027-02-28'),
    createdAt: new Date('2025-01-05'),
    members: [mockMembers[0], mockMembers[1], mockMembers[4]],
    tasks: [],
  },
  {
    id: 4,
    projectName: 'Tech Park Phase 2',
    projectAddress: 'Hitech City, Hyderabad, Telangana 500081',
    status: ProjectStatus.completed,
    projectLongitude: 78.3808,
    projectLatitude: 17.4485,
    startDate: new Date('2023-06-01'),
    endDate: new Date('2024-12-31'),
    createdAt: new Date('2023-05-01'),
    members: [mockMembers[0], mockMembers[5]],
    tasks: [],
  },
  {
    id: 5,
    projectName: 'Shopping Mall - Phoenix',
    projectAddress: 'Viman Nagar, Pune, Maharashtra 411014',
    status: ProjectStatus.onHold,
    projectLongitude: 73.919,
    projectLatitude: 18.5679,
    startDate: new Date('2024-08-01'),
    endDate: new Date('2026-07-31'),
    createdAt: new Date('2024-07-01'),
    members: [mockMembers[0], mockMembers[1]],
    tasks: [],
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 10. INVITATIONS
// ═════════════════════════════════════════════════════════════════════════════

const mockInvitations: Invitation[] = [
  {
    inviteCode: 'ECHNO2025-001',
    employeeId: 'EMP009',
    designation: 'Site Supervisor',
    department: 'Construction',
    organizationId: '1',
    organizationName: 'Echno Construction Ltd.',
    status: EmployeeStatus.active,
    joiningDate: new Date('2025-02-01'),
    salary: 75_000,
    reportingManager: 'Rajesh Kumar',
    shiftTiming: '07:00 - 16:00',
    validityDays: 30,
    expiryDate: new Date('2025-02-15'),
    maxUses: 1,
  },
  {
    inviteCode: 'ECHNO2025-002',
    employeeId: 'EMP010',
    designation: 'Junior Engineer',
    department: 'Engineering',
    organizationId: '1',
    organizationName: 'Echno Construction Ltd.',
    status: EmployeeStatus.probation,
    joiningDate: new Date('2025-02-10'),
    salary: 45_000,
    reportingManager: 'Priya Sharma',
    shiftTiming: '09:00 - 18:00',
    validityDays: 45,
    expiryDate: new Date('2025-03-01'),
    maxUses: 1,
  },
  {
    inviteCode: 'BUILDRIGHT-2025-001',
    employeeId: 'EMP011',
    designation: 'Quantity Surveyor',
    department: 'Planning',
    organizationId: '2',
    organizationName: 'BuildRight Infrastructure Pvt. Ltd.',
    status: EmployeeStatus.active,
    joiningDate: new Date('2025-03-01'),
    salary: 80_000,
    reportingManager: 'Project Manager',
    shiftTiming: '09:00 - 18:00',
    validityDays: 60,
    expiryDate: new Date('2025-04-15'),
    maxUses: 1,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 11. SHIFT TIMINGS
// ═════════════════════════════════════════════════════════════════════════════

const mockShiftTimings: ShiftTiming[] = [
  {
    shiftName: 'Day Shift - Office',
    startTime: '09:00',
    endTime: '18:00',
    lunchBreakStart: '13:00',
    lunchBreakEnd: '14:00',
    gracePeriodMinutes: 15,
    minimumWorkHours: 8,
    halfDayWorkHours: 4,
    overtimeThreshold: 9,
  },
  {
    shiftName: 'Day Shift - Site',
    startTime: '08:00',
    endTime: '17:00',
    lunchBreakStart: '12:30',
    lunchBreakEnd: '13:30',
    gracePeriodMinutes: 10,
    minimumWorkHours: 8,
    halfDayWorkHours: 4,
    overtimeThreshold: 9,
  },
  {
    shiftName: 'Early Morning Shift',
    startTime: '07:00',
    endTime: '16:00',
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00',
    gracePeriodMinutes: 10,
    minimumWorkHours: 8,
    halfDayWorkHours: 4,
    overtimeThreshold: 9,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 12. ATTENDANCE RECORDS
// ═════════════════════════════════════════════════════════════════════════════

// Helper to create clock events
function createClockEvent(
  id: number,
  eventType: ClockEventType,
  date: Date,
  hour: number,
  minute: number,
  projectId: number,
  projectName: string,
  projectLat: number,
  projectLng: number
): ClockEvent {
  const timestamp = new Date(date);
  timestamp.setHours(hour, minute, 0, 0);

  const employeeLocation: GeoLocation = {
    latitude: projectLat + (Math.random() - 0.5) * 0.001, // Within ~55 meters
    longitude: projectLng + (Math.random() - 0.5) * 0.001,
    accuracy: 5 + Math.random() * 10,
  };

  const projectLocation: GeoLocation = {
    latitude: projectLat,
    longitude: projectLng,
  };

  const distance = Math.sqrt(
    Math.pow(
      (employeeLocation.latitude - projectLocation.latitude) * 111_000,
      2
    ) +
      Math.pow(
        (employeeLocation.longitude - projectLocation.longitude) * 111_000,
        2
      )
  );

  // Array of Unsplash portrait photos for professional selfies
  const unsplashPhotos = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1557862921-37829c790f19?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  ];

  return {
    id,
    eventType,
    timestamp,
    location: employeeLocation,
    photoUrl: unsplashPhotos[id % unsplashPhotos.length],
    projectId,
    projectName,
    deviceInfo: {
      platform: ['iOS', 'Android', 'Web'][Math.floor(Math.random() * 3)],
      deviceId: `DEVICE-${Math.random().toString(36).slice(7).toUpperCase()}`,
    },
    isWithinGeofence: distance <= 100,
    distanceFromProject: Math.round(distance),
  };
}

const mockAttendance: Attendance[] = [
  // Rajesh Kumar - Full attendance for Jan 13, 2025
  {
    id: 1,
    employeeId: 'EMP001',
    employeeName: 'Rajesh Kumar',
    date: new Date('2025-01-13'),
    projectId: 1,
    projectName: 'Sunrise Tower',
    status: AttendanceStatus.present,
    shiftTiming: mockShiftTimings[0],
    morningClockIn: createClockEvent(
      1,
      ClockEventType.morningClockIn,
      new Date('2025-01-13'),
      8,
      55,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    lunchBreakStart: createClockEvent(
      2,
      ClockEventType.lunchBreakStart,
      new Date('2025-01-13'),
      13,
      0,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    lunchBreakEnd: createClockEvent(
      3,
      ClockEventType.lunchBreakEnd,
      new Date('2025-01-13'),
      14,
      0,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    eveningClockOut: createClockEvent(
      4,
      ClockEventType.eveningClockOut,
      new Date('2025-01-13'),
      18,
      10,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    workDuration: {
      totalMinutes: 490,
      hours: 8,
      minutes: 10,
      morningSession: 245,
      afternoonSession: 245,
      overtimeMinutes: 0,
      breakDuration: 60,
    },
    isLateArrival: false,
    isEarlyCheckout: false,
    isOvertime: false,
    movements: [
      {
        id: 1,
        attendanceId: 1,
        employeeId: 'EMP001',
        employeeName: 'Rajesh Kumar',
        movementType: MovementType.siteTravel,
        fromLocation: 'Sunrise Tower',
        toLocation: 'Palm Heights Site',
        startTime: new Date('2025-01-13T10:00:00'),
        endTime: new Date('2025-01-13T10:45:00'),
        durationMinutes: 45,
        distance: 12.5,
        purpose: 'Site inspection and quality check',
        startLatitude: 19.0607,
        startLongitude: 72.8347,
        endLatitude: 19.0896,
        endLongitude: 72.8656,
        isVerified: true,
        verifiedBy: 'Site Manager',
        verifiedAt: new Date('2025-01-13T11:00:00'),
        createdAt: new Date('2025-01-13T10:00:00'),
        updatedAt: new Date('2025-01-13T11:00:00'),
      },
      {
        id: 2,
        attendanceId: 1,
        employeeId: 'EMP001',
        employeeName: 'Rajesh Kumar',
        movementType: MovementType.clientMeeting,
        fromLocation: 'Palm Heights Site',
        toLocation: 'Client Office - Andheri',
        startTime: new Date('2025-01-13T15:00:00'),
        endTime: new Date('2025-01-13T16:30:00'),
        durationMinutes: 90,
        distance: 8.3,
        purpose: 'Progress review meeting with client stakeholders',
        startLatitude: 19.0896,
        startLongitude: 72.8656,
        endLatitude: 19.1136,
        endLongitude: 72.8697,
        isVerified: true,
        verifiedBy: 'Project Manager',
        verifiedAt: new Date('2025-01-13T17:00:00'),
        createdAt: new Date('2025-01-13T15:00:00'),
        updatedAt: new Date('2025-01-13T17:00:00'),
      },
    ],
    approvalStatus: 'approved',
    approvedBy: 'HR Manager',
    approvedAt: new Date('2025-01-14T10:00:00'),
    createdAt: new Date('2025-01-13T08:55:00'),
    updatedAt: new Date('2025-01-14T10:00:00'),
  },

  // Priya Sharma - Late arrival on Jan 13, 2025
  {
    id: 2,
    employeeId: 'EMP002',
    employeeName: 'Priya Sharma',
    date: new Date('2025-01-13'),
    projectId: 1,
    projectName: 'Sunrise Tower',
    status: AttendanceStatus.late,
    shiftTiming: mockShiftTimings[0],
    morningClockIn: createClockEvent(
      5,
      ClockEventType.morningClockIn,
      new Date('2025-01-13'),
      9,
      30,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    lunchBreakStart: createClockEvent(
      6,
      ClockEventType.lunchBreakStart,
      new Date('2025-01-13'),
      13,
      15,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    lunchBreakEnd: createClockEvent(
      7,
      ClockEventType.lunchBreakEnd,
      new Date('2025-01-13'),
      14,
      10,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    eveningClockOut: createClockEvent(
      8,
      ClockEventType.eveningClockOut,
      new Date('2025-01-13'),
      18,
      30,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    workDuration: {
      totalMinutes: 485,
      hours: 8,
      minutes: 5,
      morningSession: 225,
      afternoonSession: 260,
      overtimeMinutes: 0,
      breakDuration: 55,
    },
    isLateArrival: true,
    isEarlyCheckout: false,
    isOvertime: false,
    movements: [
      {
        id: 3,
        attendanceId: 2,
        employeeId: 'EMP002',
        employeeName: 'Priya Sharma',
        movementType: MovementType.materialProcurement,
        fromLocation: 'Sunrise Tower',
        toLocation: 'Hardware Supplier - Malad',
        startTime: new Date('2025-01-13T11:00:00'),
        endTime: new Date('2025-01-13T12:15:00'),
        durationMinutes: 75,
        distance: 15.2,
        purpose: 'Urgent procurement of electrical materials for site',
        startLatitude: 19.0607,
        startLongitude: 72.8347,
        endLatitude: 19.1844,
        endLongitude: 72.8479,
        isVerified: false,
        createdAt: new Date('2025-01-13T11:00:00'),
        updatedAt: new Date('2025-01-13T12:15:00'),
      },
    ],
    remarks: 'Traffic jam on Mumbai-Pune highway',
    approvalStatus: 'approved',
    approvedBy: 'HR Manager',
    approvedAt: new Date('2025-01-14T10:00:00'),
    createdAt: new Date('2025-01-13T09:30:00'),
    updatedAt: new Date('2025-01-14T10:00:00'),
  },

  // Amit Patel - Half day on Jan 13, 2025
  {
    id: 3,
    employeeId: 'EMP003',
    employeeName: 'Amit Patel',
    date: new Date('2025-01-13'),
    projectId: 1,
    projectName: 'Sunrise Tower',
    status: AttendanceStatus.halfDay,
    shiftTiming: mockShiftTimings[1],
    morningClockIn: createClockEvent(
      9,
      ClockEventType.morningClockIn,
      new Date('2025-01-13'),
      8,
      5,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    lunchBreakStart: createClockEvent(
      10,
      ClockEventType.lunchBreakStart,
      new Date('2025-01-13'),
      12,
      30,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    workDuration: {
      totalMinutes: 265,
      hours: 4,
      minutes: 25,
      morningSession: 265,
      afternoonSession: 0,
      overtimeMinutes: 0,
      breakDuration: 0,
    },
    isLateArrival: false,
    isEarlyCheckout: true,
    isOvertime: false,
    remarks: 'Doctor appointment in afternoon',
    approvalStatus: 'approved',
    approvedBy: 'Rajesh Kumar',
    approvedAt: new Date('2025-01-14T09:00:00'),
    createdAt: new Date('2025-01-13T08:05:00'),
    updatedAt: new Date('2025-01-14T09:00:00'),
  },

  // Vikram Singh - Overtime on Jan 12, 2025
  {
    id: 4,
    employeeId: 'EMP005',
    employeeName: 'Vikram Singh',
    date: new Date('2025-01-12'),
    projectId: 1,
    projectName: 'Sunrise Tower',
    status: AttendanceStatus.overtime,
    shiftTiming: mockShiftTimings[2],
    morningClockIn: createClockEvent(
      11,
      ClockEventType.morningClockIn,
      new Date('2025-01-12'),
      7,
      0,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    lunchBreakStart: createClockEvent(
      12,
      ClockEventType.lunchBreakStart,
      new Date('2025-01-12'),
      12,
      0,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    lunchBreakEnd: createClockEvent(
      13,
      ClockEventType.lunchBreakEnd,
      new Date('2025-01-12'),
      13,
      0,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    eveningClockOut: createClockEvent(
      14,
      ClockEventType.eveningClockOut,
      new Date('2025-01-12'),
      18,
      30,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    workDuration: {
      totalMinutes: 570,
      hours: 9,
      minutes: 30,
      morningSession: 300,
      afternoonSession: 270,
      overtimeMinutes: 90,
      breakDuration: 60,
    },
    isLateArrival: false,
    isEarlyCheckout: false,
    isOvertime: true,
    remarks: 'Emergency plumbing repair required',
    approvalStatus: 'approved',
    approvedBy: 'Rajesh Kumar',
    approvedAt: new Date('2025-01-13T08:00:00'),
    createdAt: new Date('2025-01-12T07:00:00'),
    updatedAt: new Date('2025-01-13T08:00:00'),
  },

  // Anjali Verma - Full attendance on Jan 12, 2025 (Green Valley project)
  {
    id: 5,
    employeeId: 'EMP006',
    employeeName: 'Anjali Verma',
    date: new Date('2025-01-12'),
    projectId: 2,
    projectName: 'Green Valley Residential Complex',
    status: AttendanceStatus.present,
    shiftTiming: mockShiftTimings[1],
    morningClockIn: createClockEvent(
      15,
      ClockEventType.morningClockIn,
      new Date('2025-01-12'),
      8,
      0,
      2,
      'Green Valley Residential Complex',
      12.9698,
      77.7499
    ),
    lunchBreakStart: createClockEvent(
      16,
      ClockEventType.lunchBreakStart,
      new Date('2025-01-12'),
      12,
      30,
      2,
      'Green Valley Residential Complex',
      12.9698,
      77.7499
    ),
    lunchBreakEnd: createClockEvent(
      17,
      ClockEventType.lunchBreakEnd,
      new Date('2025-01-12'),
      13,
      30,
      2,
      'Green Valley Residential Complex',
      12.9698,
      77.7499
    ),
    eveningClockOut: createClockEvent(
      18,
      ClockEventType.eveningClockOut,
      new Date('2025-01-12'),
      17,
      0,
      2,
      'Green Valley Residential Complex',
      12.9698,
      77.7499
    ),
    workDuration: {
      totalMinutes: 480,
      hours: 8,
      minutes: 0,
      morningSession: 270,
      afternoonSession: 210,
      overtimeMinutes: 0,
      breakDuration: 60,
    },
    isLateArrival: false,
    isEarlyCheckout: false,
    isOvertime: false,
    approvalStatus: 'approved',
    approvedBy: 'HR Manager',
    approvedAt: new Date('2025-01-13T09:00:00'),
    createdAt: new Date('2025-01-12T08:00:00'),
    updatedAt: new Date('2025-01-13T09:00:00'),
  },

  // Karan Mehta - Pending regularization (missed clock-out) on Jan 11, 2025
  {
    id: 6,
    employeeId: 'EMP007',
    employeeName: 'Karan Mehta',
    date: new Date('2025-01-11'),
    projectId: 1,
    projectName: 'Sunrise Tower',
    status: AttendanceStatus.pendingRegularization,
    shiftTiming: mockShiftTimings[0],
    morningClockIn: createClockEvent(
      19,
      ClockEventType.morningClockIn,
      new Date('2025-01-11'),
      9,
      0,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    lunchBreakStart: createClockEvent(
      20,
      ClockEventType.lunchBreakStart,
      new Date('2025-01-11'),
      13,
      0,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    lunchBreakEnd: createClockEvent(
      21,
      ClockEventType.lunchBreakEnd,
      new Date('2025-01-11'),
      14,
      0,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    workDuration: {
      totalMinutes: 240,
      hours: 4,
      minutes: 0,
      morningSession: 240,
      afternoonSession: 0,
      overtimeMinutes: 0,
      breakDuration: 0,
    },
    isLateArrival: false,
    isEarlyCheckout: false,
    isOvertime: false,
    regularization: {
      id: 1,
      reason: 'Forgot to clock out due to urgent client meeting',
      requestedBy: 'Karan Mehta',
      requestedAt: new Date('2025-01-12T09:00:00'),
      status: 'pending',
      missingEvents: ['eveningClockOut'],
    },
    approvalStatus: 'pending',
    createdAt: new Date('2025-01-11T09:00:00'),
    updatedAt: new Date('2025-01-12T09:00:00'),
  },

  // Divya Iyer - Absent on Jan 13, 2025
  {
    id: 7,
    employeeId: 'EMP008',
    employeeName: 'Divya Iyer',
    date: new Date('2025-01-13'),
    projectId: 1,
    projectName: 'Sunrise Tower',
    status: AttendanceStatus.absent,
    shiftTiming: mockShiftTimings[0],
    workDuration: {
      totalMinutes: 0,
      hours: 0,
      minutes: 0,
      morningSession: 0,
      afternoonSession: 0,
      overtimeMinutes: 0,
      breakDuration: 0,
    },
    isLateArrival: false,
    isEarlyCheckout: false,
    isOvertime: false,
    approvalStatus: 'pending',
    createdAt: new Date('2025-01-13T00:00:00'),
    updatedAt: new Date('2025-01-13T00:00:00'),
  },

  // Rajesh Kumar - Full attendance on Jan 12, 2025
  {
    id: 8,
    employeeId: 'EMP001',
    employeeName: 'Rajesh Kumar',
    date: new Date('2025-01-12'),
    projectId: 1,
    projectName: 'Sunrise Tower',
    status: AttendanceStatus.present,
    shiftTiming: mockShiftTimings[0],
    morningClockIn: createClockEvent(
      22,
      ClockEventType.morningClockIn,
      new Date('2025-01-12'),
      9,
      0,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    lunchBreakStart: createClockEvent(
      23,
      ClockEventType.lunchBreakStart,
      new Date('2025-01-12'),
      13,
      0,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    lunchBreakEnd: createClockEvent(
      24,
      ClockEventType.lunchBreakEnd,
      new Date('2025-01-12'),
      14,
      0,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    eveningClockOut: createClockEvent(
      25,
      ClockEventType.eveningClockOut,
      new Date('2025-01-12'),
      18,
      0,
      1,
      'Sunrise Tower',
      19.0607,
      72.8347
    ),
    workDuration: {
      totalMinutes: 480,
      hours: 8,
      minutes: 0,
      morningSession: 240,
      afternoonSession: 240,
      overtimeMinutes: 0,
      breakDuration: 60,
    },
    isLateArrival: false,
    isEarlyCheckout: false,
    isOvertime: false,
    approvalStatus: 'approved',
    approvedBy: 'HR Manager',
    approvedAt: new Date('2025-01-13T10:00:00'),
    createdAt: new Date('2025-01-12T09:00:00'),
    updatedAt: new Date('2025-01-13T10:00:00'),
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 13. ATTENDANCE SUMMARIES
// ═════════════════════════════════════════════════════════════════════════════

const mockAttendanceSummaries: AttendanceSummary[] = [
  {
    employeeId: 'EMP001',
    employeeName: 'Rajesh Kumar',
    month: 1,
    year: 2025,
    totalWorkingDays: 22,
    presentDays: 20,
    halfDays: 0,
    absentDays: 0,
    leaveDays: 2,
    weeklyOffs: 4,
    holidays: 2,
    lateDays: 0,
    overtimeDays: 1,
    totalHoursWorked: 168,
    totalOvertimeHours: 1.5,
    averageWorkHours: 8.4,
    attendancePercentage: 100,
    effectiveWorkDays: 22,
    baseSalary: 120_000,
    attendanceDeductions: 0,
    overtimePay: 1125,
    netSalary: 121_125,
    projectWiseAttendance: [
      {
        projectId: 1,
        projectName: 'Sunrise Tower',
        daysWorked: 22,
        hoursWorked: 168,
        overtimeHours: 1.5,
        attendancePercentage: 100,
      },
    ],
  },
  {
    employeeId: 'EMP002',
    employeeName: 'Priya Sharma',
    month: 1,
    year: 2025,
    totalWorkingDays: 22,
    presentDays: 18,
    halfDays: 1,
    absentDays: 1,
    leaveDays: 2,
    weeklyOffs: 4,
    holidays: 2,
    lateDays: 3,
    overtimeDays: 0,
    totalHoursWorked: 155,
    totalOvertimeHours: 0,
    averageWorkHours: 7.75,
    attendancePercentage: 91.8,
    effectiveWorkDays: 20.2,
    baseSalary: 85_000,
    attendanceDeductions: 6954.55,
    overtimePay: 0,
    netSalary: 78_045.45,
    projectWiseAttendance: [
      {
        projectId: 1,
        projectName: 'Sunrise Tower',
        daysWorked: 20,
        hoursWorked: 155,
        overtimeHours: 0,
        attendancePercentage: 90.9,
      },
    ],
  },
  {
    employeeId: 'EMP003',
    employeeName: 'Amit Patel',
    month: 1,
    year: 2025,
    totalWorkingDays: 22,
    presentDays: 19,
    halfDays: 2,
    absentDays: 1,
    leaveDays: 0,
    weeklyOffs: 4,
    holidays: 2,
    lateDays: 1,
    overtimeDays: 0,
    totalHoursWorked: 156,
    totalOvertimeHours: 0,
    averageWorkHours: 7.8,
    attendancePercentage: 90.9,
    effectiveWorkDays: 20,
    baseSalary: 55_000,
    attendanceDeductions: 5000,
    overtimePay: 0,
    netSalary: 50_000,
    projectWiseAttendance: [
      {
        projectId: 1,
        projectName: 'Sunrise Tower',
        daysWorked: 21,
        hoursWorked: 156,
        overtimeHours: 0,
        attendancePercentage: 95.5,
      },
    ],
  },
  {
    employeeId: 'EMP005',
    employeeName: 'Vikram Singh',
    month: 1,
    year: 2025,
    totalWorkingDays: 22,
    presentDays: 20,
    halfDays: 0,
    absentDays: 0,
    leaveDays: 2,
    weeklyOffs: 4,
    holidays: 2,
    lateDays: 0,
    overtimeDays: 3,
    totalHoursWorked: 172,
    totalOvertimeHours: 4.5,
    averageWorkHours: 8.6,
    attendancePercentage: 100,
    effectiveWorkDays: 22,
    baseSalary: 48_000,
    attendanceDeductions: 0,
    overtimePay: 1227.27,
    netSalary: 49_227.27,
    projectWiseAttendance: [
      {
        projectId: 1,
        projectName: 'Sunrise Tower',
        daysWorked: 22,
        hoursWorked: 172,
        overtimeHours: 4.5,
        attendancePercentage: 100,
      },
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 14. AGGREGATED EXPORT
// ═════════════════════════════════════════════════════════════════════════════

export const COMPREHENSIVE_MOCK_DATA = {
  users: mockUsers,
  employees: mockEmployees,
  organizations: mockOrganizations,
  members: mockMembers,
  workCategories: mockWorkCategories,
  issueComments: mockIssueComments,
  issues: mockIssues,
  tasks: mockTasks,
  projects: mockProjects,
  invitations: mockInvitations,
  shiftTimings: mockShiftTimings,
  attendance: mockAttendance,
  attendanceSummaries: mockAttendanceSummaries,
};

// Individual exports for convenience
export {
  mockMembers,
  mockWorkCategories,
  mockIssueComments,
  mockIssues,
  mockTasks,
  mockProjects,
  mockInvitations,
  mockShiftTimings,
  mockAttendance,
  mockAttendanceSummaries,
};

// ═════════════════════════════════════════════════════════════════════════════
// 15. UTILITY FUNCTIONS FOR MOCK DATA
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get employee by ID
 */
export function getEmployeeById(id: number): Employee | undefined {
  return mockEmployees.find((emp) => emp.id === id);
}

/**
 * Get project by ID
 */
export function getProjectById(id: number): Project | undefined {
  return mockProjects.find((proj) => proj.id === id);
}

/**
 * Get tasks for a specific project
 */
export function getTasksForProject(projectId: number): Task[] {
  return mockTasks.filter((task) => task.projectId === projectId);
}

/**
 * Get issues for a specific task
 */
export function getIssuesForTask(task: Task): Issue[] {
  return task.issues || [];
}

/**
 * Get organization by ID
 */
export function getOrganizationById(id: number): Organization | undefined {
  return mockOrganizations.find((org) => org.id === id);
}

/**
 * Get all active employees
 */
export function getActiveEmployees(): Employee[] {
  return mockEmployees.filter((emp) => emp.status === EmployeeStatus.active);
}

/**
 * Get employees by department
 */
export function getEmployeesByDepartment(department: Department): Employee[] {
  return mockEmployees.filter((emp) => emp.department === department);
}

/**
 * Get open issues
 */
export function getOpenIssues(): Issue[] {
  return mockIssues.filter(
    (issue) =>
      issue.status === IssueStatus.open ||
      issue.status === IssueStatus.inProgress
  );
}

/**
 * Get ongoing tasks
 */
export function getOngoingTasks(): Task[] {
  return mockTasks.filter((task) => task.status === TaskStatus.onGoing);
}

/**
 * Get upcoming tasks
 */
export function getUpcomingTasks(): Task[] {
  return mockTasks.filter((task) => task.status === TaskStatus.upcoming);
}

/**
 * Get completed tasks
 */
export function getCompletedTasks(): Task[] {
  return mockTasks.filter((task) => task.status === TaskStatus.completed);
}

/**
 * Get active invitations
 */
export function getActiveInvitations(): Invitation[] {
  return mockInvitations.filter((inv) => {
    if (!inv.expiryDate) return true;
    return inv.expiryDate > new Date();
  });
}

/**
 * Get projects by status
 */
export function getProjectsByStatus(status: ProjectStatus): Project[] {
  return mockProjects.filter((proj) => proj.status === status);
}

/**
 * Get attendance for employee by date range
 */
export function getAttendanceByEmployeeAndDateRange(
  employeeId: string,
  startDate: Date,
  endDate: Date
): Attendance[] {
  return mockAttendance.filter(
    (att) =>
      att.employeeId === employeeId &&
      att.date >= startDate &&
      att.date <= endDate
  );
}

/**
 * Get attendance for project by date
 */
export function getAttendanceByProjectAndDate(
  projectId: number,
  date: Date
): Attendance[] {
  return mockAttendance.filter(
    (att) =>
      att.projectId === projectId &&
      att.date.toDateString() === date.toDateString()
  );
}

/**
 * Get attendance by date range
 */
export function getAttendanceByDateRange(
  startDate: Date,
  endDate: Date
): Attendance[] {
  return mockAttendance.filter(
    (att) => att.date >= startDate && att.date <= endDate
  );
}

/**
 * Get pending attendance regularizations
 */
export function getPendingRegularizations(): Attendance[] {
  return mockAttendance.filter(
    (att) => att.regularization && att.regularization.status === 'pending'
  );
}

/**
 * Get attendance summary for employee
 */
export function getAttendanceSummaryByEmployee(
  employeeId: string,
  month: number,
  year: number
): AttendanceSummary | undefined {
  return mockAttendanceSummaries.find(
    (summary) =>
      summary.employeeId === employeeId &&
      summary.month === month &&
      summary.year === year
  );
}

/**
 * Get all attendance summaries for a month
 */
export function getAttendanceSummariesByMonth(
  month: number,
  year: number
): AttendanceSummary[] {
  return mockAttendanceSummaries.filter(
    (summary) => summary.month === month && summary.year === year
  );
}

/**
 * Calculate attendance percentage for employee
 */
export function calculateAttendancePercentage(
  employeeId: string,
  startDate: Date,
  endDate: Date
): number {
  const attendanceRecords = getAttendanceByEmployeeAndDateRange(
    employeeId,
    startDate,
    endDate
  );

  if (attendanceRecords.length === 0) return 0;

  const presentCount = attendanceRecords.filter(
    (att) =>
      att.status === AttendanceStatus.present ||
      att.status === AttendanceStatus.late ||
      att.status === AttendanceStatus.overtime ||
      att.status === AttendanceStatus.leave
  ).length;

  return (presentCount / attendanceRecords.length) * 100;
}

/**
 * Get employees with low attendance (below threshold)
 */
export function getEmployeesWithLowAttendance(
  month: number,
  year: number,
  threshold: number = 80
): AttendanceSummary[] {
  return mockAttendanceSummaries.filter(
    (summary) =>
      summary.month === month &&
      summary.year === year &&
      summary.attendancePercentage < threshold
  );
}

/**
 * Get overtime workers for a month
 */
export function getOvertimeWorkers(
  month: number,
  year: number
): AttendanceSummary[] {
  return mockAttendanceSummaries.filter(
    (summary) =>
      summary.month === month &&
      summary.year === year &&
      summary.overtimeDays > 0
  );
}

/**
 * Get project-wise attendance for a date
 */
export function getProjectWiseAttendance(
  date: Date
): Record<number, Attendance[]> {
  const attendanceByProject: Record<number, Attendance[]> = {};

  for (const att of mockAttendance.filter(
    (att) => att.date.toDateString() === date.toDateString()
  )) {
    if (!attendanceByProject[att.projectId]) {
      attendanceByProject[att.projectId] = [];
    }
    attendanceByProject[att.projectId].push(att);
  }

  return attendanceByProject;
}

// ═════════════════════════════════════════════════════════════════════════════
// 11. LEAVE MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Mock Leave Requests
 */
export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'LV-2025-001',
    employeeId: '1',
    employeeName: 'Rajesh Kumar',
    employeeEmail: 'rajesh.kumar@echno.com',
    department: 'Engineering',
    leaveType: LeaveType.earnedLeave,
    fromDate: new Date('2025-01-20'),
    toDate: new Date('2025-01-22'),
    daysCount: 3,
    reason: 'Family vacation to Goa',
    status: LeaveStatus.approved,
    appliedAt: new Date('2025-01-10'),
    approvers: [
      {
        id: 'APP-001',
        employeeId: '4',
        employeeName: 'Sneha Reddy',
        employeeEmail: 'sneha.reddy@echno.com',
        role: 'HR Manager',
        approvedAt: new Date('2025-01-11'),
        comments: 'Approved. Enjoy your vacation!',
      },
    ],
    delegation: {
      delegateToId: '2',
      delegateToName: 'Priya Sharma',
      delegateToEmail: 'priya.sharma@echno.com',
      responsibilities: 'Handle project reviews and client meetings',
      notified: true,
    },
    attachments: [],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-11'),
  },
  {
    id: 'LV-2025-002',
    employeeId: '2',
    employeeName: 'Priya Sharma',
    employeeEmail: 'priya.sharma@echno.com',
    department: 'Engineering',
    leaveType: LeaveType.sickLeave,
    fromDate: new Date('2025-01-15'),
    toDate: new Date('2025-01-16'),
    daysCount: 2,
    reason: 'Fever and flu',
    status: LeaveStatus.approved,
    appliedAt: new Date('2025-01-14'),
    approvers: [
      {
        id: 'APP-002',
        employeeId: '4',
        employeeName: 'Sneha Reddy',
        employeeEmail: 'sneha.reddy@echno.com',
        role: 'HR Manager',
        approvedAt: new Date('2025-01-14'),
        comments: 'Approved. Take rest and get well soon.',
      },
    ],
    attachments: [
      {
        id: 'ATT-001',
        fileName: 'medical-certificate.pdf',
        fileUrl: '/documents/medical-certificate.pdf',
        fileType: 'application/pdf',
        uploadedAt: new Date('2025-01-14'),
      },
    ],
    emergencyContact: '+91 98765 11111',
    createdAt: new Date('2025-01-14'),
    updatedAt: new Date('2025-01-14'),
  },
  {
    id: 'LV-2025-003',
    employeeId: '3',
    employeeName: 'Amit Patel',
    employeeEmail: 'amit.patel@echno.com',
    department: 'Electrical',
    leaveType: LeaveType.casualLeave,
    fromDate: new Date('2025-02-05'),
    toDate: new Date('2025-02-05'),
    daysCount: 1,
    reason: 'Personal work - bank visit',
    status: LeaveStatus.pending,
    appliedAt: new Date('2025-01-30'),
    approvers: [
      {
        id: 'APP-003',
        employeeId: '4',
        employeeName: 'Sneha Reddy',
        employeeEmail: 'sneha.reddy@echno.com',
        role: 'HR Manager',
      },
    ],
    currentApproverId: '4',
    attachments: [],
    createdAt: new Date('2025-01-30'),
    updatedAt: new Date('2025-01-30'),
  },
  {
    id: 'LV-2025-004',
    employeeId: '5',
    employeeName: 'Vikram Singh',
    employeeEmail: 'vikram.singh@echno.com',
    department: 'Operations',
    leaveType: LeaveType.paternityLeave,
    fromDate: new Date('2025-02-10'),
    toDate: new Date('2025-02-24'),
    daysCount: 15,
    reason: 'Expecting a baby',
    status: LeaveStatus.pending,
    appliedAt: new Date('2025-01-25'),
    approvers: [
      {
        id: 'APP-004',
        employeeId: '4',
        employeeName: 'Sneha Reddy',
        employeeEmail: 'sneha.reddy@echno.com',
        role: 'HR Manager',
      },
    ],
    currentApproverId: '4',
    delegation: {
      delegateToId: '6',
      delegateToName: 'Ananya Iyer',
      delegateToEmail: 'ananya.iyer@echno.com',
      responsibilities: 'Manage site operations and coordinate with vendors',
      notified: true,
    },
    attachments: [],
    emergencyContact: '+91 98765 33333',
    createdAt: new Date('2025-01-25'),
    updatedAt: new Date('2025-01-25'),
  },
  {
    id: 'LV-2025-005',
    employeeId: '7',
    employeeName: 'Karthik Menon',
    employeeEmail: 'karthik.menon@echno.com',
    department: 'Administration',
    leaveType: LeaveType.casualLeave,
    fromDate: new Date('2025-01-18'),
    toDate: new Date('2025-01-18'),
    daysCount: 1,
    reason: 'Wedding anniversary celebration',
    status: LeaveStatus.approved,
    appliedAt: new Date('2025-01-12'),
    approvers: [
      {
        id: 'APP-005',
        employeeId: '4',
        employeeName: 'Sneha Reddy',
        employeeEmail: 'sneha.reddy@echno.com',
        role: 'HR Manager',
        approvedAt: new Date('2025-01-13'),
        comments: 'Approved. Congratulations!',
      },
    ],
    attachments: [],
    createdAt: new Date('2025-01-12'),
    updatedAt: new Date('2025-01-13'),
  },
  {
    id: 'LV-2025-006',
    employeeId: '8',
    employeeName: 'Divya Nair',
    employeeEmail: 'divya.nair@echno.com',
    department: 'Finance',
    leaveType: LeaveType.sickLeave,
    fromDate: new Date('2025-02-15'),
    toDate: new Date('2025-02-17'),
    daysCount: 3,
    reason: 'Dental surgery',
    status: LeaveStatus.pending,
    appliedAt: new Date('2025-02-01'),
    approvers: [
      {
        id: 'APP-006',
        employeeId: '4',
        employeeName: 'Sneha Reddy',
        employeeEmail: 'sneha.reddy@echno.com',
        role: 'HR Manager',
      },
    ],
    currentApproverId: '4',
    attachments: [
      {
        id: 'ATT-002',
        fileName: 'dental-appointment.pdf',
        fileUrl: '/documents/dental-appointment.pdf',
        fileType: 'application/pdf',
        uploadedAt: new Date('2025-02-01'),
      },
    ],
    emergencyContact: '+91 98765 44444',
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01'),
  },
  {
    id: 'LV-2025-007',
    employeeId: '1',
    employeeName: 'Rajesh Kumar',
    employeeEmail: 'rajesh.kumar@echno.com',
    department: 'Engineering',
    leaveType: LeaveType.earnedLeave,
    fromDate: new Date('2025-03-10'),
    toDate: new Date('2025-03-14'),
    daysCount: 5,
    reason: "Attending cousin's wedding in Delhi",
    status: LeaveStatus.draft,
    appliedAt: new Date('2025-02-05'),
    approvers: [],
    attachments: [],
    createdAt: new Date('2025-02-05'),
    updatedAt: new Date('2025-02-05'),
  },
  {
    id: 'LV-2025-008',
    employeeId: '2',
    employeeName: 'Priya Sharma',
    employeeEmail: 'priya.sharma@echno.com',
    department: 'Engineering',
    leaveType: LeaveType.casualLeave,
    fromDate: new Date('2025-01-12'),
    toDate: new Date('2025-01-12'),
    daysCount: 1,
    reason: 'House maintenance work',
    status: LeaveStatus.rejected,
    appliedAt: new Date('2025-01-10'),
    approvers: [
      {
        id: 'APP-007',
        employeeId: '4',
        employeeName: 'Sneha Reddy',
        employeeEmail: 'sneha.reddy@echno.com',
        role: 'HR Manager',
        rejectedAt: new Date('2025-01-11'),
        comments: 'Critical project deadline on this date. Please reschedule.',
      },
    ],
    attachments: [],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-11'),
  },
];

/**
 * Mock Employee Leave Quotas
 */
export const mockEmployeeLeaveQuotas: EmployeeLeaveQuota[] = [
  {
    employeeId: '1',
    employeeName: 'Rajesh Kumar',
    department: 'Engineering',
    period: QuotaPeriod.yearly,
    year: 2025,
    balances: [
      {
        leaveType: LeaveType.casualLeave,
        allocated: 12,
        used: 2,
        pending: 0,
        available: 10,
        encashable: 0,
        carriedForward: 0,
      },
      {
        leaveType: LeaveType.sickLeave,
        allocated: 12,
        used: 0,
        pending: 0,
        available: 12,
        encashable: 0,
        carriedForward: 0,
      },
      {
        leaveType: LeaveType.earnedLeave,
        allocated: 21,
        used: 3,
        pending: 5,
        available: 13,
        encashable: 8,
        carriedForward: 0,
      },
      {
        leaveType: LeaveType.compensatoryOff,
        allocated: 0,
        used: 0,
        pending: 0,
        available: 2,
        encashable: 0,
        carriedForward: 2,
      },
    ],
    effectiveFrom: new Date('2025-01-01'),
    effectiveTo: new Date('2025-12-31'),
    lastUpdated: new Date('2025-02-05'),
  },
  {
    employeeId: '2',
    employeeName: 'Priya Sharma',
    department: 'Engineering',
    period: QuotaPeriod.yearly,
    year: 2025,
    balances: [
      {
        leaveType: LeaveType.casualLeave,
        allocated: 12,
        used: 0,
        pending: 1,
        available: 11,
        encashable: 0,
        carriedForward: 0,
      },
      {
        leaveType: LeaveType.sickLeave,
        allocated: 12,
        used: 2,
        pending: 0,
        available: 10,
        encashable: 0,
        carriedForward: 0,
      },
      {
        leaveType: LeaveType.earnedLeave,
        allocated: 21,
        used: 0,
        pending: 0,
        available: 21,
        encashable: 15,
        carriedForward: 0,
      },
    ],
    effectiveFrom: new Date('2025-01-01'),
    effectiveTo: new Date('2025-12-31'),
    lastUpdated: new Date('2025-02-05'),
  },
  {
    employeeId: '3',
    employeeName: 'Amit Patel',
    department: 'Electrical',
    period: QuotaPeriod.yearly,
    year: 2025,
    balances: [
      {
        leaveType: LeaveType.casualLeave,
        allocated: 12,
        used: 3,
        pending: 1,
        available: 8,
        encashable: 0,
        carriedForward: 0,
      },
      {
        leaveType: LeaveType.sickLeave,
        allocated: 12,
        used: 1,
        pending: 0,
        available: 11,
        encashable: 0,
        carriedForward: 0,
      },
      {
        leaveType: LeaveType.earnedLeave,
        allocated: 21,
        used: 5,
        pending: 0,
        available: 16,
        encashable: 10,
        carriedForward: 0,
      },
    ],
    effectiveFrom: new Date('2025-01-01'),
    effectiveTo: new Date('2025-12-31'),
    lastUpdated: new Date('2025-02-05'),
  },
  {
    employeeId: '4',
    employeeName: 'Sneha Reddy',
    department: 'Human Resources',
    period: QuotaPeriod.yearly,
    year: 2025,
    balances: [
      {
        leaveType: LeaveType.casualLeave,
        allocated: 12,
        used: 1,
        pending: 0,
        available: 11,
        encashable: 0,
        carriedForward: 0,
      },
      {
        leaveType: LeaveType.sickLeave,
        allocated: 12,
        used: 0,
        pending: 0,
        available: 12,
        encashable: 0,
        carriedForward: 0,
      },
      {
        leaveType: LeaveType.earnedLeave,
        allocated: 21,
        used: 8,
        pending: 0,
        available: 13,
        encashable: 5,
        carriedForward: 0,
      },
    ],
    effectiveFrom: new Date('2025-01-01'),
    effectiveTo: new Date('2025-12-31'),
    lastUpdated: new Date('2025-02-05'),
  },
  {
    employeeId: '5',
    employeeName: 'Vikram Singh',
    department: 'Operations',
    period: QuotaPeriod.yearly,
    year: 2025,
    balances: [
      {
        leaveType: LeaveType.casualLeave,
        allocated: 12,
        used: 4,
        pending: 0,
        available: 8,
        encashable: 0,
        carriedForward: 0,
      },
      {
        leaveType: LeaveType.sickLeave,
        allocated: 12,
        used: 2,
        pending: 0,
        available: 10,
        encashable: 0,
        carriedForward: 0,
      },
      {
        leaveType: LeaveType.earnedLeave,
        allocated: 21,
        used: 6,
        pending: 0,
        available: 15,
        encashable: 8,
        carriedForward: 0,
      },
      {
        leaveType: LeaveType.paternityLeave,
        allocated: 15,
        used: 0,
        pending: 15,
        available: 0,
        encashable: 0,
        carriedForward: 0,
      },
    ],
    effectiveFrom: new Date('2025-01-01'),
    effectiveTo: new Date('2025-12-31'),
    lastUpdated: new Date('2025-02-05'),
  },
];

/**
 * Get leave requests for an employee
 */
export function getEmployeeLeaveRequests(employeeId: string): LeaveRequest[] {
  return mockLeaveRequests.filter((leave) => leave.employeeId === employeeId);
}

/**
 * Get pending leave requests
 */
export function getPendingLeaveRequests(): LeaveRequest[] {
  return mockLeaveRequests.filter(
    (leave) => leave.status === LeaveStatus.pending
  );
}

/**
 * Get leave requests by status
 */
export function getLeaveRequestsByStatus(status: LeaveStatus): LeaveRequest[] {
  return mockLeaveRequests.filter((leave) => leave.status === status);
}

/**
 * Get leave requests for approval (for a specific approver)
 */
export function getLeaveRequestsForApproval(
  approverId: string
): LeaveRequest[] {
  return mockLeaveRequests.filter(
    (leave) =>
      leave.status === LeaveStatus.pending &&
      leave.currentApproverId === approverId
  );
}

/**
 * Get employee leave quota
 */
export function getEmployeeLeaveQuota(
  employeeId: string,
  year: number
): EmployeeLeaveQuota | undefined {
  return mockEmployeeLeaveQuotas.find(
    (quota) => quota.employeeId === employeeId && quota.year === year
  );
}

/**
 * Get leave balance for specific type
 */
export function getLeaveBalance(
  employeeId: string,
  leaveType: LeaveType,
  year: number
): LeaveBalance | undefined {
  const quota = getEmployeeLeaveQuota(employeeId, year);
  return quota?.balances.find((balance) => balance.leaveType === leaveType);
}

/**
 * Get upcoming leaves (approved leaves in the future)
 */
export function getUpcomingLeaves(): LeaveRequest[] {
  const today = new Date();
  return mockLeaveRequests.filter(
    (leave) => leave.status === LeaveStatus.approved && leave.fromDate > today
  );
}

/**
 * Get leaves by date range
 */
export function getLeavesByDateRange(
  fromDate: Date,
  toDate: Date
): LeaveRequest[] {
  return mockLeaveRequests.filter(
    (leave) =>
      (leave.fromDate >= fromDate && leave.fromDate <= toDate) ||
      (leave.toDate >= fromDate && leave.toDate <= toDate) ||
      (leave.fromDate <= fromDate && leave.toDate >= toDate)
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RESOURCES - INVENTORY, LOCATIONS, ASSETS
// ═════════════════════════════════════════════════════════════════════════════


// Mock Locations
export const mockLocations: Location[] = [
  {
    id: 1,
    name: 'Godown A',
    type: 'godown',
    address: 'Plot No. 45, MIDC Industrial Area, Andheri East, Mumbai - 400093',
    capacity: 5000,
    organizationId: 1,
    isActive: true,
  },
  {
    id: 2,
    name: 'Project Site - Gateway Plaza',
    type: 'project-site',
    address: 'Bandra West, Mumbai - 400050',
    capacity: 2000,
    organizationId: 1,
    projectId: 1,
    isActive: true,
  },
  {
    id: 3,
    name: 'Head Office Warehouse',
    type: 'head-office',
    address: 'Powai, Mumbai - 400076',
    capacity: 1000,
    organizationId: 1,
    isActive: true,
  },
  {
    id: 4,
    name: 'Godown B - Navi Mumbai',
    type: 'godown',
    address: 'Sector 11, Vashi, Navi Mumbai - 400703',
    capacity: 8000,
    organizationId: 1,
    isActive: true,
  },
  {
    id: 5,
    name: 'Project Site - Marina Heights',
    type: 'project-site',
    address: 'Worli Sea Face, Mumbai - 400018',
    capacity: 1500,
    organizationId: 1,
    projectId: 2,
    isActive: true,
  },
  {
    id: 6,
    name: 'Thane Warehouse',
    type: 'warehouse',
    address: 'Ghodbunder Road, Thane - 400607',
    capacity: 3000,
    organizationId: 1,
    isActive: true,
  },
  {
    id: 7,
    name: 'Project Site - Emerald Tower',
    type: 'project-site',
    address: 'Parel, Mumbai - 400012',
    capacity: 1200,
    organizationId: 1,
    projectId: 3,
    isActive: false,
  },
  {
    id: 8,
    name: 'Godown C - Panvel',
    type: 'godown',
    address: 'MIDC Industrial Area, Panvel, Navi Mumbai - 410206',
    capacity: 6000,
    organizationId: 1,
    isActive: true,
  },
  {
    id: 9,
    name: 'Project Site - Crystal Towers',
    type: 'project-site',
    address: 'Lower Parel, Mumbai - 400013',
    capacity: 1800,
    organizationId: 1,
    projectId: 4,
    isActive: true,
  },
  {
    id: 10,
    name: 'Kalyan Warehouse',
    type: 'warehouse',
    address: 'Kalyan Bhiwandi Road, Kalyan - 421306',
    capacity: 4500,
    organizationId: 1,
    isActive: true,
  },
  {
    id: 11,
    name: 'Project Site - Skyline Residency',
    type: 'project-site',
    address: 'Malad West, Mumbai - 400064',
    capacity: 1600,
    organizationId: 1,
    projectId: 5,
    isActive: true,
  },
  {
    id: 12,
    name: 'Regional Office - Pune',
    type: 'head-office',
    address: 'Hinjewadi IT Park, Phase 1, Pune - 411057',
    capacity: 800,
    organizationId: 1,
    isActive: true,
  },
  {
    id: 13,
    name: 'Godown D - Turbhe',
    type: 'godown',
    address: 'MIDC Turbhe, Navi Mumbai - 400705',
    capacity: 7000,
    organizationId: 1,
    isActive: true,
  },
  {
    id: 14,
    name: 'Project Site - Grand Palladium',
    type: 'project-site',
    address: 'Andheri West, Mumbai - 400053',
    capacity: 2200,
    organizationId: 1,
    projectId: 6,
    isActive: true,
  },
  {
    id: 15,
    name: 'Borivali Warehouse',
    type: 'warehouse',
    address: 'Industrial Estate, Borivali East, Mumbai - 400066',
    capacity: 3500,
    organizationId: 1,
    isActive: true,
  },
];

// Mock inventory count per location
export const mockLocationInventory: Record<number, number> = {
  1: 6,
  2: 4,
  3: 3,
  4: 8,
  5: 2,
  6: 5,
  7: 0,
  8: 7,
  9: 3,
  10: 6,
  11: 4,
  12: 2,
  13: 9,
  14: 5,
  15: 4,
};

// Helper function to get location by ID
export function getLocationById(id: number): Location | undefined {
  return mockLocations.find((loc) => loc.id === id);
}

// Mock Inventory Items
export const mockInventoryItems: InventoryItem[] = [
  {
    id: 1,
    itemId: 'INV-001',
    name: 'Portland Cement - Grade 53',
    description:
      'High-grade cement for structural concrete work. Suitable for all types of construction including high-rise buildings, bridges, and industrial structures.',
    category: 'cement',
    quantity: 450,
    unit: 'bags',
    minStockLevel: 200,
    maxStockLevel: 1000,
    reorderPoint: 250,
    locationId: 1,
    location: mockLocations[0],
    unitPrice: 350,
    totalValue: 157_500,
    vendorId: 1, // UltraTech Cement Ltd.
    brand: 'UltraTech',
    specifications: {
      grade: '53',
      packagingSize: '50 kg',
      compressiveStrength: '53 MPa',
      standard: 'IS 12269:2013',
    },
    batchNumber: 'UT-2024-11-001',
    lastRestockedDate: new Date('2024-10-25'),
    notes: 'Store in dry conditions. Keep away from moisture.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-10-25'),
  },
  {
    id: 2,
    itemId: 'INV-002',
    name: 'TMT Steel Bars - 12mm',
    description: 'Thermo-Mechanically Treated reinforcement bars',
    category: 'steel',
    quantity: 150,
    unit: 'pieces',
    minStockLevel: 100,
    maxStockLevel: 500,
    reorderPoint: 120,
    locationId: 1,
    location: mockLocations[0],
    unitPrice: 450,
    totalValue: 67_500,
    vendorId: 2, // Tata Steel
    brand: 'Tata Tiscon',
    batchNumber: 'TS-12MM-2024-045',
    lastRestockedDate: new Date('2024-11-01'),
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: 3,
    itemId: 'INV-003',
    name: 'River Sand (Fine Aggregate)',
    description: 'Washed river sand for concrete mixing',
    category: 'aggregates',
    quantity: 25,
    unit: 'tons',
    minStockLevel: 50,
    maxStockLevel: 200,
    reorderPoint: 60,
    locationId: 2,
    location: mockLocations[1],
    unitPrice: 1200,
    totalValue: 30_000,
    vendorId: 3, // Mumbai Aggregates
    notes: 'Low stock - urgent reorder needed',
    lastRestockedDate: new Date('2024-10-15'),
    lastUsedDate: new Date('2024-11-05'),
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-11-05'),
  },
  {
    id: 4,
    itemId: 'INV-004',
    name: 'Red Clay Bricks',
    description: 'Standard size clay bricks for masonry',
    category: 'bricks',
    quantity: 5000,
    unit: 'pieces',
    minStockLevel: 2000,
    maxStockLevel: 10_000,
    reorderPoint: 3000,
    locationId: 2,
    location: mockLocations[1],
    unitPrice: 8,
    totalValue: 40_000,
    vendorId: 1, // Maharashtra Brick Works
    brand: 'Premium Clay',
    batchNumber: 'MBW-2024-10-025',
    lastRestockedDate: new Date('2024-10-20'),
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-10-20'),
  },
  {
    id: 5,
    itemId: 'INV-005',
    name: 'Electrical Wiring Cable - 2.5mm²',
    description: 'Copper electrical wiring cable',
    category: 'electrical',
    quantity: 0,
    unit: 'meters',
    minStockLevel: 500,
    maxStockLevel: 2000,
    reorderPoint: 600,
    locationId: 3,
    location: mockLocations[2],
    unitPrice: 15,
    totalValue: 0,
    vendorId: 4, // Havells India Ltd.
    brand: 'Havells',
    notes: 'OUT OF STOCK - Order placed',
    lastUsedDate: new Date('2024-11-03'),
    createdAt: new Date('2024-05-10'),
    updatedAt: new Date('2024-11-05'),
  },
  {
    id: 6,
    itemId: 'INV-006',
    name: 'PVC Pipes - 4 inch',
    description: 'PVC pipes for plumbing work',
    category: 'plumbing',
    quantity: 180,
    unit: 'pieces',
    minStockLevel: 100,
    maxStockLevel: 300,
    reorderPoint: 120,
    locationId: 1,
    location: mockLocations[0],
    unitPrice: 280,
    totalValue: 50_400,
    vendorId: 5, // Supreme Industries
    brand: 'Supreme',
    batchNumber: 'SUP-4IN-2024-08',
    lastRestockedDate: new Date('2024-09-15'),
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-09-15'),
  },
  {
    id: 7,
    itemId: 'INV-007',
    name: 'White Cement',
    description: 'Premium white cement for finishing work',
    category: 'cement',
    quantity: 120,
    unit: 'bags',
    minStockLevel: 50,
    maxStockLevel: 200,
    reorderPoint: 70,
    locationId: 1,
    location: mockLocations[0],
    unitPrice: 450,
    totalValue: 54_000,
    vendorId: 1, // Birla White
    brand: 'Birla White',
    batchNumber: 'BW-2024-10-015',
    lastRestockedDate: new Date('2024-10-15'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-10-15'),
  },
  {
    id: 8,
    itemId: 'INV-008',
    name: 'Granite Tiles - 2x2 ft',
    description: 'Polished granite tiles for flooring',
    category: 'tiles',
    quantity: 250,
    unit: 'pieces',
    minStockLevel: 150,
    maxStockLevel: 500,
    reorderPoint: 180,
    locationId: 2,
    location: mockLocations[1],
    unitPrice: 380,
    totalValue: 95_000,
    vendorId: 2, // Kajaria Ceramics
    brand: 'Kajaria',
    batchNumber: 'KAJ-GT-2024-09',
    lastRestockedDate: new Date('2024-09-25'),
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-09-25'),
  },
  {
    id: 9,
    itemId: 'INV-009',
    name: 'Asian Paints Tractor Emulsion',
    description: 'Interior wall paint - white',
    category: 'paints',
    quantity: 45,
    unit: 'liters',
    minStockLevel: 30,
    maxStockLevel: 100,
    reorderPoint: 40,
    locationId: 3,
    location: mockLocations[2],
    unitPrice: 580,
    totalValue: 26_100,
    vendorId: 3, // Asian Paints
    brand: 'Asian Paints',
    batchNumber: 'AP-TE-2024-10',
    lastRestockedDate: new Date('2024-10-05'),
    createdAt: new Date('2024-04-15'),
    updatedAt: new Date('2024-10-05'),
  },
  {
    id: 10,
    itemId: 'INV-010',
    name: 'LED Bulbs - 9W',
    description: 'Energy-efficient LED bulbs',
    category: 'electrical',
    quantity: 320,
    unit: 'pieces',
    minStockLevel: 200,
    maxStockLevel: 500,
    reorderPoint: 250,
    locationId: 3,
    location: mockLocations[2],
    unitPrice: 95,
    totalValue: 30_400,
    vendorId: 4, // Philips India
    brand: 'Philips',
    batchNumber: 'PH-LED-2024-10',
    lastRestockedDate: new Date('2024-10-12'),
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-10-12'),
  },
  {
    id: 11,
    itemId: 'INV-011',
    name: 'Safety Helmets',
    description: 'Industrial safety helmets - ISI certified',
    category: 'safety-equipment',
    quantity: 85,
    unit: 'pieces',
    minStockLevel: 50,
    maxStockLevel: 150,
    reorderPoint: 60,
    locationId: 2,
    location: mockLocations[1],
    unitPrice: 180,
    totalValue: 15_300,
    vendorId: 5, // Karam Industries
    brand: 'Karam',
    batchNumber: 'KI-SH-2024-08',
    lastRestockedDate: new Date('2024-08-20'),
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-08-20'),
  },
  {
    id: 12,
    itemId: 'INV-012',
    name: 'TMT Steel Bars - 16mm',
    description: 'Thermo-Mechanically Treated reinforcement bars',
    category: 'steel',
    quantity: 220,
    unit: 'pieces',
    minStockLevel: 150,
    maxStockLevel: 400,
    reorderPoint: 180,
    locationId: 1,
    location: mockLocations[0],
    unitPrice: 620,
    totalValue: 136_400,
    vendorId: 2, // JSW Steel
    brand: 'JSW Neosteel',
    batchNumber: 'JSW-16MM-2024-09',
    lastRestockedDate: new Date('2024-09-10'),
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-09-10'),
  },
  {
    id: 13,
    itemId: 'INV-013',
    name: 'Door Hinges - Heavy Duty',
    description: 'Stainless steel door hinges',
    category: 'hardware',
    quantity: 145,
    unit: 'pieces',
    minStockLevel: 100,
    maxStockLevel: 300,
    reorderPoint: 120,
    locationId: 3,
    location: mockLocations[2],
    unitPrice: 250,
    totalValue: 36_250,
    vendorId: 1, // Godrej supplier: 'Godrej & Boyce', Boyce
    brand: 'Godrej',
    batchNumber: 'GB-DH-2024-07',
    lastRestockedDate: new Date('2024-07-15'),
    createdAt: new Date('2024-06-10'),
    updatedAt: new Date('2024-07-15'),
  },
  {
    id: 14,
    itemId: 'INV-014',
    name: 'Marble Tiles - 2x3 ft',
    description: 'Italian marble tiles for premium flooring',
    category: 'tiles',
    quantity: 180,
    unit: 'pieces',
    minStockLevel: 100,
    maxStockLevel: 300,
    reorderPoint: 120,
    locationId: 2,
    location: mockLocations[1],
    unitPrice: 850,
    totalValue: 153_000,
    vendorId: 2, // Johnson Tiles
    brand: 'Johnson',
    batchNumber: 'JT-MT-2024-08',
    lastRestockedDate: new Date('2024-08-25'),
    createdAt: new Date('2024-04-20'),
    updatedAt: new Date('2024-08-25'),
  },
  {
    id: 15,
    itemId: 'INV-015',
    name: 'Crushed Stone - 20mm',
    description: 'Crushed stone aggregate for concrete',
    category: 'aggregates',
    quantity: 65,
    unit: 'tons',
    minStockLevel: 40,
    maxStockLevel: 150,
    reorderPoint: 50,
    locationId: 1,
    location: mockLocations[0],
    unitPrice: 1500,
    totalValue: 97_500,
    vendorId: 3, // Mumbai Aggregates
    batchNumber: 'MA-20MM-2024-10',
    lastRestockedDate: new Date('2024-10-08'),
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-10-08'),
  },
];

// Mock stock history
export const mockStockHistory = [
  {
    id: 1,
    date: new Date('2024-10-25'),
    type: 'restock' as const,
    quantity: 200,
    previousQuantity: 250,
    newQuantity: 450,
    performedBy: 'Rajesh Kumar',
    notes: 'Monthly stock replenishment',
  },
  {
    id: 2,
    date: new Date('2024-10-20'),
    type: 'usage' as const,
    quantity: -50,
    previousQuantity: 300,
    newQuantity: 250,
    performedBy: 'Site Manager',
    notes: 'Used for Gateway Plaza project',
  },
  {
    id: 3,
    date: new Date('2024-10-15'),
    type: 'adjustment' as const,
    quantity: -10,
    previousQuantity: 310,
    newQuantity: 300,
    performedBy: 'Warehouse Admin',
    notes: 'Stock audit adjustment - damaged bags removed',
  },
  {
    id: 4,
    date: new Date('2024-09-28'),
    type: 'restock' as const,
    quantity: 150,
    previousQuantity: 160,
    newQuantity: 310,
    performedBy: 'Rajesh Kumar',
    notes: 'Regular procurement',
  },
];

// Helper function to get inventory item by ID
export function getInventoryItemById(id: number): InventoryItem | undefined {
  return mockInventoryItems.find((item) => item.id === id);
}

// ═════════════════════════════════════════════════════════════════════════════
// THIRD PARTY - LABOUR, VENDORS, SUB-CONTRACTS
// ═════════════════════════════════════════════════════════════════════════════

// Mock Labour data
export const mockLabour = [
  {
    id: 1,
    labourId: 'LAB-001',
    name: 'Raju Kumar',
    phone: '+91 98765 43210',
    email: 'raju.kumar@example.com',
    address: '123, Worker Colony, Sector 15, Delhi - 110001',
    trade: 'Mason',
    type: 'daily',
    skillLevel: 'skilled',
    status: 'active',
    dailyRate: 800,
    overtimeRate: 100,
    currentProject: 'Metro Station Phase 2',
    joiningDate: new Date('2024-01-15'),
    totalWorkDays: 180,
    totalDue: 5600,
    contractorName: 'ABC Contractors',
    contractorPhone: '+91 98765 00000',
    aadhaarNumber: '1234 5678 9012',
    panNumber: 'ABCDE1234F',
    bankAccount: '1234567890',
    bankName: 'State Bank of India',
    ifscCode: 'SBIN0001234',
    emergencyContact: '+91 98765 11111',
    emergencyContactName: 'Ramesh Kumar',
    notes:
      'Experienced mason with excellent work quality. Punctual and reliable.',
  },
  {
    id: 2,
    labourId: 'LAB-002',
    name: 'Suresh Yadav',
    phone: '+91 98765 43211',
    trade: 'Carpenter',
    type: 'monthly',
    skillLevel: 'highlySkilled',
    status: 'active',
    monthlyRate: 25_000,
    currentProject: 'Residential Complex',
    joiningDate: new Date('2024-02-01'),
    totalWorkDays: 165,
    totalDue: 12_000,
    contractorName: 'XYZ Construction',
  },
  {
    id: 3,
    labourId: 'LAB-003',
    name: 'Ramesh Singh',
    phone: '+91 98765 43212',
    trade: 'Plumber',
    type: 'contract',
    skillLevel: 'skilled',
    status: 'active',
    dailyRate: 900,
    currentProject: 'Commercial Plaza',
    joiningDate: new Date('2024-03-10'),
    totalWorkDays: 120,
    totalDue: 3200,
    contractorName: 'DEF Enterprises',
  },
  {
    id: 4,
    labourId: 'LAB-004',
    name: 'Mohan Lal',
    phone: '+91 98765 43213',
    trade: 'Painter',
    type: 'daily',
    skillLevel: 'semiskilled',
    status: 'onLeave',
    dailyRate: 650,
    currentProject: 'Residential Complex',
    joiningDate: new Date('2024-01-20'),
    totalWorkDays: 140,
    totalDue: 0,
  },
  {
    id: 5,
    labourId: 'LAB-005',
    name: 'Vijay Kumar',
    phone: '+91 98765 43214',
    trade: 'Electrician',
    type: 'monthly',
    skillLevel: 'highlySkilled',
    status: 'active',
    monthlyRate: 28_000,
    currentProject: 'Metro Station Phase 2',
    joiningDate: new Date('2023-12-01'),
    totalWorkDays: 220,
    totalDue: 8400,
    contractorName: 'ABC Contractors',
  },
];

// Mock Vendors data
export const mockVendors = [
  {
    id: 1,
    vendorId: 'VEN-001',
    companyName: 'Steel Solutions Pvt Ltd',
    contactPerson: 'Amit Sharma',
    phone: '+91 98765 43210',
    email: 'amit@steelsolutions.com',
    type: 'material',
    status: 'active',
    category: ['Steel', 'Reinforcement'],
    totalPurchaseValue: 5_800_000,
    totalOutstanding: 280_000,
    paymentTerms: 'net30',
    rating: 4.5,
    totalOrders: 48,
    onTimeDeliveryRate: 92,
  },
  {
    id: 2,
    vendorId: 'VEN-002',
    companyName: 'Cement Traders Co',
    contactPerson: 'Rajesh Kumar',
    phone: '+91 98765 43211',
    email: 'rajesh@cementtraders.com',
    type: 'material',
    status: 'active',
    category: ['Cement', 'Aggregates'],
    totalPurchaseValue: 4_200_000,
    totalOutstanding: 150_000,
    paymentTerms: 'net15',
    rating: 4.2,
    totalOrders: 65,
    onTimeDeliveryRate: 88,
  },
  {
    id: 3,
    vendorId: 'VEN-003',
    companyName: 'Equipment Rentals Inc',
    contactPerson: 'Sunil Verma',
    phone: '+91 98765 43212',
    email: 'sunil@equipmentrentals.com',
    type: 'equipment',
    status: 'active',
    category: ['Machinery', 'Tools'],
    totalPurchaseValue: 3_600_000,
    totalOutstanding: 420_000,
    paymentTerms: 'net60',
    rating: 4.8,
    totalOrders: 32,
    onTimeDeliveryRate: 95,
  },
  {
    id: 4,
    vendorId: 'VEN-004',
    companyName: 'Transport Services Ltd',
    contactPerson: 'Vijay Singh',
    phone: '+91 98765 43213',
    email: 'vijay@transportservices.com',
    type: 'transport',
    status: 'active',
    category: ['Logistics', 'Delivery'],
    totalPurchaseValue: 1_800_000,
    totalOutstanding: 95_000,
    paymentTerms: 'immediate',
    rating: 4,
    totalOrders: 124,
    onTimeDeliveryRate: 85,
  },
  {
    id: 5,
    vendorId: 'VEN-005',
    companyName: 'Security Solutions',
    contactPerson: 'Mohan Lal',
    phone: '+91 98765 43214',
    email: 'mohan@securitysolutions.com',
    type: 'service',
    status: 'inactive',
    category: ['Security', 'Surveillance'],
    totalPurchaseValue: 850_000,
    totalOutstanding: 0,
    paymentTerms: 'net30',
    rating: 3.8,
    totalOrders: 18,
    onTimeDeliveryRate: 90,
  },
];

// Mock Sub-Contracts data
export const mockContracts = [
  {
    id: 1,
    contractId: 'SC-001',
    contractName: 'Foundation & Structural Work',
    contractorName: 'BuildRight Contractors',
    contactPerson: 'Ramesh Kumar',
    phone: '+91 98765 43210',
    type: 'lumpsum',
    status: 'active',
    contractValue: 8_500_000,
    totalPaid: 5_100_000,
    totalDue: 3_400_000,
    completionPercentage: 65,
    projectName: 'Metro Station Phase 2',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-08-15'),
    paymentStatus: 'inProgress',
    overallRating: 4.5,
  },
  {
    id: 2,
    contractId: 'SC-002',
    contractName: 'HVAC Installation',
    contractorName: 'CoolTech Systems',
    contactPerson: 'Suresh Yadav',
    phone: '+91 98765 43211',
    type: 'itemRate',
    status: 'active',
    contractValue: 4_200_000,
    totalPaid: 2_940_000,
    totalDue: 1_260_000,
    completionPercentage: 70,
    projectName: 'Commercial Plaza',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-07-31'),
    paymentStatus: 'inProgress',
    overallRating: 4.2,
  },
  {
    id: 3,
    contractId: 'SC-003',
    contractName: 'Electrical Work - Main Building',
    contractorName: 'PowerLine Electricals',
    contactPerson: 'Vijay Singh',
    phone: '+91 98765 43212',
    type: 'unitPrice',
    status: 'active',
    contractValue: 3_600_000,
    totalPaid: 2_160_000,
    totalDue: 1_440_000,
    completionPercentage: 60,
    projectName: 'Residential Complex',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-09-30'),
    paymentStatus: 'inProgress',
    overallRating: 4.8,
  },
  {
    id: 4,
    contractId: 'SC-004',
    contractName: 'Interior Finishing',
    contractorName: 'FinishPro Interiors',
    contactPerson: 'Mohan Lal',
    phone: '+91 98765 43213',
    type: 'timeAndMaterial',
    status: 'onHold',
    contractValue: 5_200_000,
    totalPaid: 1_040_000,
    totalDue: 4_160_000,
    completionPercentage: 20,
    projectName: 'Commercial Plaza',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-10-31'),
    paymentStatus: 'inProgress',
    overallRating: 3.9,
  },
  {
    id: 5,
    contractId: 'SC-005',
    contractName: 'Plumbing & Sanitation',
    contractorName: 'FlowMaster Plumbers',
    contactPerson: 'Anil Sharma',
    phone: '+91 98765 43214',
    type: 'lumpsum',
    status: 'completed',
    contractValue: 2_800_000,
    totalPaid: 2_800_000,
    totalDue: 0,
    completionPercentage: 100,
    projectName: 'Residential Complex',
    startDate: new Date('2023-11-01'),
    endDate: new Date('2024-03-31'),
    paymentStatus: 'fullyPaid',
    overallRating: 4.6,
  },
];

// Helper functions
// Mock Locations

// Mock inventory count per location
// Helper function to get location by ID

export const mockAssetLocationHistory: AssetLocationHistory[] = [
  {
    id: 1,
    assetId: 1,
    fromLocationId: 2,
    fromLocation: mockLocations[1],
    toLocationId: 1,
    toLocation: mockLocations[0],
    transferDate: new Date('2024-06-15'),
    transferredBy: 'Amit Sharma',
    reason: 'Project reassignment',
    notes: 'Transferred from warehouse to Metro project site',
    previousAssignedTo: 'Available',
    newAssignedTo: 'Ravi Kumar',
    newProject: 'Metro Line Extension',
  },
  {
    id: 2,
    assetId: 1,
    toLocationId: 2,
    toLocation: mockLocations[1],
    transferDate: new Date('2024-03-20'),
    transferredBy: 'Suresh Patel',
    reason: 'Maintenance completion',
    notes: 'Returned to warehouse after scheduled maintenance',
  },
  {
    id: 3,
    assetId: 3,
    fromLocationId: 1,
    fromLocation: mockLocations[0],
    toLocationId: 3,
    toLocation: mockLocations[2],
    transferDate: new Date('2024-09-10'),
    transferredBy: 'Priya Singh',
    reason: 'New project deployment',
    notes: 'Tower crane deployed to high-rise construction site',
    previousProject: 'Metro Line Extension',
    newAssignedTo: 'Deepak Verma',
    newProject: 'Skyline Towers',
  },
  {
    id: 4,
    assetId: 5,
    toLocationId: 1,
    toLocation: mockLocations[0],
    transferDate: new Date('2024-08-01'),
    transferredBy: 'Rajesh Kumar',
    reason: 'Equipment pooling',
    notes: 'Generator moved to main site for backup power',
  },
  {
    id: 5,
    assetId: 10,
    fromLocationId: 3,
    fromLocation: mockLocations[2],
    toLocationId: 1,
    toLocation: mockLocations[0],
    transferDate: new Date('2024-10-25'),
    transferredBy: 'Amit Sharma',
    reason: 'Equipment failure',
    notes: 'Vibrating roller sent for major repairs - vibration system malfunction',
    previousAssignedTo: 'Mohan Lal',
    previousProject: 'Highway Expansion',
  },
];

export const mockAssets: Asset[] = [
  {
    id: 1,
    assetId: 'AST-2024-001',
    name: 'Excavator CAT 320D',
    description: 'Heavy-duty hydraulic excavator for earthmoving operations',
    type: 'heavy-equipment',
    category: 'Excavators',
    status: 'in-use',
    condition: 'good',
    locationId: 1,
    location: mockLocations[0],
    assignedTo: 'Ravi Kumar',
    assignedProject: 'Metro Line Extension',
    purchaseDate: new Date('2020-03-15'),
    purchasePrice: 8500000,
    currentValue: 6800000,
    depreciationRate: 10,
    manufacturer: 'Caterpillar',
    model: '320D',
    serialNumber: 'CAT320D2020001',
    registrationNumber: 'KA-01-EQ-1234',
    warrantyExpiry: new Date('2025-03-15'),
    lastMaintenanceDate: new Date('2024-10-15'),
    nextMaintenanceDate: new Date('2025-01-15'),
    maintenanceSchedule: 'Every 500 hours',
    usageHours: 4200,
    maxUsageHours: 15000,
    fuelType: 'Diesel',
    insuranceExpiry: new Date('2025-06-30'),
    insuranceProvider: 'HDFC Ergo',
    policyNumber: 'HDFC-EQ-2024-001',
    specifications: {
      operatingWeight: '20,000 kg',
      enginePower: '121 HP',
      bucketCapacity: '1.2 m³',
      maxDiggingDepth: '6.5 m'
    },
    notes: 'Regular maintenance required. Fuel consumption: 12L/hr average',
    locationHistory: mockAssetLocationHistory.filter(h => h.assetId === 1),
    createdAt: new Date('2020-03-15'),
    updatedAt: new Date('2024-10-15'),
  },
  {
    id: 2,
    assetId: 'AST-2024-002',
    name: 'Backhoe Loader JCB 3DX',
    description: 'Versatile construction equipment for digging and loading',
    type: 'heavy-equipment',
    category: 'Loaders',
    status: 'available',
    condition: 'excellent',
    locationId: 2,
    location: mockLocations[1],
    purchaseDate: new Date('2021-08-20'),
    purchasePrice: 3200000,
    currentValue: 2700000,
    depreciationRate: 8,
    manufacturer: 'JCB',
    model: '3DX Super',
    serialNumber: 'JCB3DX2021002',
    registrationNumber: 'KA-02-EQ-5678',
    warrantyExpiry: new Date('2026-08-20'),
    lastMaintenanceDate: new Date('2024-09-10'),
    nextMaintenanceDate: new Date('2024-12-10'),
    maintenanceSchedule: 'Every 250 hours',
    usageHours: 1850,
    maxUsageHours: 12000,
    fuelType: 'Diesel',
    insuranceExpiry: new Date('2025-08-20'),
    insuranceProvider: 'ICICI Lombard',
    policyNumber: 'ICICI-EQ-2024-002',
    specifications: {
      operatingWeight: '7,500 kg',
      enginePower: '74 HP',
      bucketCapacity: '1.0 m³',
      maxDiggingDepth: '4.5 m'
    },
    notes: 'Excellent condition, recently serviced',
    createdAt: new Date('2021-08-20'),
    updatedAt: new Date('2024-09-10'),
  },
  {
    id: 3,
    assetId: 'AST-2024-003',
    name: 'Tower Crane Liebherr 132 EC-H',
    description: 'High-capacity tower crane for vertical construction',
    type: 'heavy-equipment',
    category: 'Cranes',
    status: 'in-use',
    condition: 'good',
    locationId: 1,
    location: mockLocations[0],
    assignedTo: 'Suresh Patel',
    assignedProject: 'Metro Line Extension',
    purchaseDate: new Date('2019-01-10'),
    purchasePrice: 15000000,
    currentValue: 11000000,
    depreciationRate: 12,
    manufacturer: 'Liebherr',
    model: '132 EC-H 8 Litronic',
    serialNumber: 'LBR132EC2019001',
    registrationNumber: 'KA-01-CR-9012',
    warrantyExpiry: new Date('2024-01-10'),
    lastMaintenanceDate: new Date('2024-10-01'),
    nextMaintenanceDate: new Date('2024-11-15'),
    maintenanceSchedule: 'Monthly inspection required',
    usageHours: 6800,
    maxUsageHours: 20000,
    insuranceExpiry: new Date('2025-03-31'),
    insuranceProvider: 'Bajaj Allianz',
    policyNumber: 'BAJAJ-CR-2024-001',
    specifications: {
      maxLoadCapacity: '8,000 kg',
      jibLength: '60 m',
      hookHeight: '45 m',
      radius: '50 m'
    },
    notes: 'Critical equipment. Requires certified operator. Monthly safety checks mandatory.',
    createdAt: new Date('2019-01-10'),
    updatedAt: new Date('2024-10-01'),
  },
  {
    id: 4,
    assetId: 'AST-2024-004',
    name: 'Concrete Mixer Truck Schwing Stetter',
    description: 'Transit mixer for concrete transportation',
    type: 'vehicle',
    category: 'Concrete Equipment',
    status: 'maintenance',
    condition: 'fair',
    locationId: 3,
    location: mockLocations[2],
    purchaseDate: new Date('2018-06-15'),
    purchasePrice: 4500000,
    currentValue: 2800000,
    depreciationRate: 15,
    manufacturer: 'Schwing Stetter',
    model: 'AM 7 FBP',
    serialNumber: 'SCHW2018004',
    registrationNumber: 'KA-03-VH-3456',
    warrantyExpiry: new Date('2023-06-15'),
    lastMaintenanceDate: new Date('2024-10-20'),
    nextMaintenanceDate: new Date('2024-11-20'),
    maintenanceSchedule: 'Every 200 hours or monthly',
    usageHours: 8500,
    maxUsageHours: 15000,
    fuelType: 'Diesel',
    insuranceExpiry: new Date('2025-06-15'),
    insuranceProvider: 'TATA AIG',
    policyNumber: 'TATA-VH-2024-003',
    specifications: {
      drumCapacity: '7 m³',
      enginePower: '210 HP',
      maxSpeed: '40 km/h',
      waterTankCapacity: '500 L'
    },
    notes: 'Under maintenance for hydraulic system repair',
    locationHistory: mockAssetLocationHistory.filter(h => h.assetId === 4),
    createdAt: new Date('2018-06-15'),
    updatedAt: new Date('2024-10-20'),
  },
  {
    id: 5,
    assetId: 'AST-2024-005',
    name: 'Generator 125 KVA',
    description: 'Diesel generator for backup power supply',
    type: 'generator',
    category: 'Power Equipment',
    status: 'available',
    condition: 'good',
    locationId: 4,
    location: mockLocations[3],
    purchaseDate: new Date('2022-02-10'),
    purchasePrice: 850000,
    currentValue: 720000,
    depreciationRate: 8,
    manufacturer: 'Cummins',
    model: 'C125 D5',
    serialNumber: 'CUM125D2022001',
    lastMaintenanceDate: new Date('2024-09-15'),
    nextMaintenanceDate: new Date('2025-03-15'),
    maintenanceSchedule: 'Every 6 months',
    usageHours: 520,
    maxUsageHours: 25000,
    fuelType: 'Diesel',
    insuranceExpiry: new Date('2025-02-10'),
    insuranceProvider: 'New India Assurance',
    policyNumber: 'NIA-GEN-2024-001',
    specifications: {
      power: '125 KVA / 100 KW',
      voltage: '415V',
      frequency: '50 Hz',
      fuelTankCapacity: '200 L'
    },
    notes: 'Backup power for construction site. Low usage hours.',
    createdAt: new Date('2022-02-10'),
    updatedAt: new Date('2024-09-15'),
  },
  {
    id: 6,
    assetId: 'AST-2024-006',
    name: 'Compressor Atlas Copco',
    description: 'Portable air compressor for pneumatic tools',
    type: 'machinery',
    category: 'Air Equipment',
    status: 'in-use',
    condition: 'good',
    locationId: 1,
    location: mockLocations[0],
    assignedTo: 'Mechanical Team',
    assignedProject: 'Metro Line Extension',
    purchaseDate: new Date('2021-11-05'),
    purchasePrice: 320000,
    currentValue: 260000,
    depreciationRate: 10,
    manufacturer: 'Atlas Copco',
    model: 'XAHS 186',
    serialNumber: 'ATLAS2021006',
    warrantyExpiry: new Date('2024-11-05'),
    lastMaintenanceDate: new Date('2024-08-20'),
    nextMaintenanceDate: new Date('2024-11-20'),
    maintenanceSchedule: 'Every 500 hours',
    usageHours: 2100,
    maxUsageHours: 20000,
    fuelType: 'Diesel',
    specifications: {
      airFlow: '10.5 m³/min',
      workingPressure: '7 bar',
      enginePower: '115 HP'
    },
    notes: 'Used for jackhammer operations',
    createdAt: new Date('2021-11-05'),
    updatedAt: new Date('2024-08-20'),
  },
  {
    id: 7,
    assetId: 'AST-2024-007',
    name: 'Dumper Truck Tata LPK 2518',
    description: '10-wheeler tipper truck for material transportation',
    type: 'vehicle',
    category: 'Transport',
    status: 'in-use',
    condition: 'good',
    locationId: 2,
    location: mockLocations[1],
    assignedTo: 'Transport Department',
    assignedProject: 'Residential Complex',
    purchaseDate: new Date('2020-09-25'),
    purchasePrice: 2800000,
    currentValue: 2100000,
    depreciationRate: 12,
    manufacturer: 'Tata Motors',
    model: 'LPK 2518',
    serialNumber: 'TATA2020007',
    registrationNumber: 'KA-04-VH-7890',
    warrantyExpiry: new Date('2025-09-25'),
    lastMaintenanceDate: new Date('2024-09-30'),
    nextMaintenanceDate: new Date('2024-12-30'),
    maintenanceSchedule: 'Every 10,000 km',
    usageHours: 4200,
    maxUsageHours: 20000,
    fuelType: 'Diesel',
    insuranceExpiry: new Date('2025-09-25'),
    insuranceProvider: 'Oriental Insurance',
    policyNumber: 'ORI-VH-2024-004',
    specifications: {
      payloadCapacity: '18 tons',
      enginePower: '180 HP',
      bodyLength: '5.5 m',
      fuelTankCapacity: '200 L'
    },
    notes: 'Regular hauling duties. Good fuel efficiency.',
    createdAt: new Date('2020-09-25'),
    updatedAt: new Date('2024-09-30'),
  },
  {
    id: 8,
    assetId: 'AST-2024-008',
    name: 'Welding Machine Miller',
    description: 'Industrial welding machine for steel fabrication',
    type: 'tool',
    category: 'Welding Equipment',
    status: 'available',
    condition: 'excellent',
    locationId: 3,
    location: mockLocations[2],
    purchaseDate: new Date('2023-03-12'),
    purchasePrice: 180000,
    currentValue: 165000,
    depreciationRate: 5,
    manufacturer: 'Miller',
    model: 'Syncrowave 350 LX',
    serialNumber: 'MILL2023008',
    warrantyExpiry: new Date('2026-03-12'),
    lastMaintenanceDate: new Date('2024-06-15'),
    nextMaintenanceDate: new Date('2025-06-15'),
    maintenanceSchedule: 'Annual maintenance',
    usageHours: 850,
    maxUsageHours: 10000,
    specifications: {
      outputCurrent: '350A',
      dutyCycle: '100%',
      inputPower: '415V 3-phase'
    },
    notes: 'TIG/MIG welding capable. Excellent condition.',
    createdAt: new Date('2023-03-12'),
    updatedAt: new Date('2024-06-15'),
  },
  {
    id: 9,
    assetId: 'AST-2024-009',
    name: 'Forklift Toyota 3 Ton',
    description: 'Electric forklift for warehouse operations',
    type: 'light-equipment',
    category: 'Material Handling',
    status: 'available',
    condition: 'good',
    locationId: 4,
    location: mockLocations[3],
    purchaseDate: new Date('2021-07-18'),
    purchasePrice: 950000,
    currentValue: 780000,
    depreciationRate: 9,
    manufacturer: 'Toyota',
    model: '8FBE15',
    serialNumber: 'TOY2021009',
    warrantyExpiry: new Date('2026-07-18'),
    lastMaintenanceDate: new Date('2024-08-10'),
    nextMaintenanceDate: new Date('2025-02-10'),
    maintenanceSchedule: 'Every 6 months',
    usageHours: 2400,
    maxUsageHours: 15000,
    fuelType: 'Electric',
    specifications: {
      liftCapacity: '3 tons',
      liftHeight: '4.5 m',
      batteryVoltage: '48V',
      batteryCapacity: '500 Ah'
    },
    notes: 'Battery recently replaced. Indoor use only.',
    createdAt: new Date('2021-07-18'),
    updatedAt: new Date('2024-08-10'),
  },
  {
    id: 10,
    assetId: 'AST-2024-010',
    name: 'Vibrating Roller Hamm HD+90',
    description: 'Tandem roller for soil and asphalt compaction',
    type: 'heavy-equipment',
    category: 'Compaction',
    status: 'repair',
    condition: 'poor',
    locationId: 1,
    location: mockLocations[0],
    purchaseDate: new Date('2017-04-22'),
    purchasePrice: 4200000,
    currentValue: 2400000,
    depreciationRate: 14,
    manufacturer: 'Hamm',
    model: 'HD+ 90 VV',
    serialNumber: 'HAMM2017010',
    registrationNumber: 'KA-01-EQ-2468',
    lastMaintenanceDate: new Date('2024-10-25'),
    nextMaintenanceDate: new Date('2024-12-01'),
    maintenanceSchedule: 'Every 300 hours',
    usageHours: 9200,
    maxUsageHours: 15000,
    fuelType: 'Diesel',
    insuranceExpiry: new Date('2025-04-22'),
    insuranceProvider: 'United India Insurance',
    policyNumber: 'UII-EQ-2024-002',
    specifications: {
      operatingWeight: '9 tons',
      workingWidth: '1.7 m',
      enginePower: '74 HP',
      vibrationFrequency: '67 Hz'
    },
    notes: 'Under repair - vibration system malfunction. High usage hours.',
    createdAt: new Date('2017-04-22'),
    updatedAt: new Date('2024-10-25'),
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// PURCHASE ORDERS
// ═════════════════════════════════════════════════════════════════════════════


export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 1,
    poNumber: 'PO-2024-001',
    type: PurchaseOrderType.materials,
    status: PurchaseOrderStatus.approved,
    deliveryStatus: DeliveryStatus.scheduled,
    vendorId: 1,
    projectId: 1,
    poDate: new Date('2024-10-15'),
    expectedDeliveryDate: new Date('2024-11-20'),
    deliveryAddress: 'Site A, Metro Line Extension, Bangalore',
    deliveryLocationId: 1,
    lineItems: [
      {
        id: 1,
        description: 'TMT Steel Bars - 16mm',
        specifications: 'Fe500D Grade, 12m length',
        quantity: 50,
        unit: 'Ton',
        unitPrice: 58000,
        taxRate: 18,
        taxAmount: 522000,
        subtotal: 2900000,
        total: 3422000,
        quantityReceived: 0,
        quantityPending: 50,
        expectedDeliveryDate: new Date('2024-11-20'),
        destinationLocationId: 1,
      },
      {
        id: 2,
        description: 'TMT Steel Bars - 12mm',
        specifications: 'Fe500D Grade, 12m length',
        quantity: 30,
        unit: 'Ton',
        unitPrice: 59000,
        taxRate: 18,
        taxAmount: 318600,
        subtotal: 1770000,
        total: 2088600,
        quantityReceived: 0,
        quantityPending: 30,
        expectedDeliveryDate: new Date('2024-11-20'),
        destinationLocationId: 1,
      },
    ],
    subtotal: 4670000,
    taxAmount: 840600,
    discountAmount: 0,
    shippingCost: 25000,
    otherCharges: 5000,
    totalAmount: 5540600,
    paymentTerms: 'Net 30',
    paymentMethod: 'Bank Transfer',
    advancePaymentRequired: true,
    advancePaymentPercentage: 30,
    advancePaymentAmount: 1662180,
    vendorName: 'Steel Solutions Pvt Ltd',
    vendorContactPerson: 'Amit Sharma',
    vendorPhone: '+91 98765 43210',
    vendorEmail: 'amit@steelsolutions.com',
    vendorAddress: '123 Industrial Area, Bangalore - 560001',
    vendorGstNumber: '29ABCDE1234F1Z5',
    taxType: 'GST',
    placeOfSupply: 'Karnataka',
    requestedBy: 1,
    requestedAt: new Date('2024-10-15'),
    approvedBy: 2,
    approvedAt: new Date('2024-10-16'),
    qualityCheckRequired: true,
    invoiceIds: [],
    createdBy: 1,
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-10-16'),
  },
  {
    id: 2,
    poNumber: 'PO-2024-002',
    type: PurchaseOrderType.equipment,
    status: PurchaseOrderStatus.sent,
    deliveryStatus: DeliveryStatus.inTransit,
    vendorId: 3,
    projectId: 2,
    poDate: new Date('2024-10-20'),
    expectedDeliveryDate: new Date('2024-11-10'),
    deliveryAddress: 'Site B, Highway Expansion Project, Mysore',
    deliveryLocationId: 3,
    lineItems: [
      {
        id: 3,
        description: 'Concrete Vibrator - Electric',
        specifications: '2.5 HP, 50mm needle',
        quantity: 5,
        unit: 'Nos',
        unitPrice: 12000,
        taxRate: 18,
        taxAmount: 10800,
        subtotal: 60000,
        total: 70800,
        quantityReceived: 3,
        quantityPending: 2,
        expectedDeliveryDate: new Date('2024-11-10'),
        actualDeliveryDate: new Date('2024-11-05'),
        destinationLocationId: 3,
      },
      {
        id: 4,
        description: 'Safety Helmets',
        specifications: 'ISI Marked, Multi-color',
        quantity: 100,
        unit: 'Nos',
        unitPrice: 350,
        taxRate: 12,
        taxAmount: 4200,
        subtotal: 35000,
        total: 39200,
        quantityReceived: 100,
        quantityPending: 0,
        expectedDeliveryDate: new Date('2024-11-10'),
        actualDeliveryDate: new Date('2024-11-05'),
        destinationLocationId: 3,
      },
    ],
    subtotal: 95000,
    taxAmount: 15000,
    discountAmount: 2000,
    shippingCost: 3000,
    otherCharges: 500,
    totalAmount: 111500,
    paymentTerms: 'Net 15',
    paymentMethod: 'Cash',
    advancePaymentRequired: false,
    vendorName: 'Equipment Rentals Inc',
    vendorContactPerson: 'Sunil Verma',
    vendorPhone: '+91 98765 43212',
    vendorEmail: 'sunil@equipmentrentals.com',
    vendorAddress: '456 Equipment Hub, Bangalore - 560002',
    vendorGstNumber: '29FGHIJ5678K1L5',
    taxType: 'GST',
    placeOfSupply: 'Karnataka',
    requestedBy: 3,
    requestedAt: new Date('2024-10-20'),
    approvedBy: 2,
    approvedAt: new Date('2024-10-21'),
    acknowledgedAt: new Date('2024-10-22'),
    vendorPoNumber: 'VPO-2024-089',
    qualityCheckRequired: true,
    qualityCheckStatus: 'passed',
    inspectedBy: 4,
    inspectedAt: new Date('2024-11-06'),
    invoiceIds: [],
    createdBy: 3,
    createdAt: new Date('2024-10-20'),
    updatedAt: new Date('2024-11-06'),
  },
  {
    id: 3,
    poNumber: 'PO-2024-003',
    type: PurchaseOrderType.materials,
    status: PurchaseOrderStatus.partiallyReceived,
    deliveryStatus: DeliveryStatus.partiallyDelivered,
    vendorId: 2,
    projectId: 1,
    poDate: new Date('2024-10-01'),
    expectedDeliveryDate: new Date('2024-10-25'),
    actualDeliveryDate: new Date('2024-10-28'),
    deliveryAddress: 'Site A, Metro Line Extension, Bangalore',
    deliveryLocationId: 1,
    lineItems: [
      {
        id: 5,
        description: 'Ordinary Portland Cement - Grade 53',
        specifications: 'OPC 53, 50kg bags',
        quantity: 200,
        unit: 'Bags',
        unitPrice: 420,
        taxRate: 18,
        taxAmount: 15120,
        subtotal: 84000,
        total: 99120,
        quantityReceived: 150,
        quantityPending: 50,
        expectedDeliveryDate: new Date('2024-10-25'),
        actualDeliveryDate: new Date('2024-10-28'),
        destinationLocationId: 1,
        notes: 'Partial delivery - remaining 50 bags expected next week',
      },
      {
        id: 6,
        description: '20mm Aggregates',
        specifications: 'Crushed stone, clean',
        quantity: 100,
        unit: 'CFT',
        unitPrice: 85,
        taxRate: 5,
        taxAmount: 425,
        subtotal: 8500,
        total: 8925,
        quantityReceived: 100,
        quantityPending: 0,
        expectedDeliveryDate: new Date('2024-10-25'),
        actualDeliveryDate: new Date('2024-10-28'),
        destinationLocationId: 1,
      },
    ],
    subtotal: 92500,
    taxAmount: 15545,
    discountAmount: 1500,
    shippingCost: 2500,
    otherCharges: 0,
    totalAmount: 109045,
    paymentTerms: 'Net 15',
    paymentMethod: 'Bank Transfer',
    advancePaymentRequired: false,
    vendorName: 'Cement Traders Co',
    vendorContactPerson: 'Rajesh Kumar',
    vendorPhone: '+91 98765 43211',
    vendorEmail: 'rajesh@cementtraders.com',
    vendorAddress: '789 Trade Center, Bangalore - 560003',
    vendorGstNumber: '29KLMNO9012P1Q5',
    taxType: 'GST',
    placeOfSupply: 'Karnataka',
    requestedBy: 1,
    requestedAt: new Date('2024-10-01'),
    approvedBy: 2,
    approvedAt: new Date('2024-10-02'),
    acknowledgedAt: new Date('2024-10-03'),
    vendorPoNumber: 'VPO-2024-067',
    qualityCheckRequired: true,
    qualityCheckStatus: 'passed',
    inspectedBy: 4,
    inspectedAt: new Date('2024-10-29'),
    invoiceIds: [],
    createdBy: 1,
    createdAt: new Date('2024-10-01'),
    updatedAt: new Date('2024-10-29'),
  },
  {
    id: 4,
    poNumber: 'PO-2024-004',
    type: PurchaseOrderType.rental,
    status: PurchaseOrderStatus.completed,
    deliveryStatus: DeliveryStatus.delivered,
    vendorId: 3,
    projectId: 2,
    poDate: new Date('2024-09-15'),
    expectedDeliveryDate: new Date('2024-09-20'),
    actualDeliveryDate: new Date('2024-09-20'),
    deliveryAddress: 'Site B, Highway Expansion Project, Mysore',
    deliveryLocationId: 3,
    lineItems: [
      {
        id: 7,
        description: 'Mini Excavator Rental',
        specifications: 'JCB 8026, 30 days rental',
        quantity: 1,
        unit: 'Month',
        unitPrice: 85000,
        taxRate: 18,
        taxAmount: 15300,
        subtotal: 85000,
        total: 100300,
        quantityReceived: 1,
        quantityPending: 0,
        expectedDeliveryDate: new Date('2024-09-20'),
        actualDeliveryDate: new Date('2024-09-20'),
        destinationLocationId: 3,
      },
    ],
    subtotal: 85000,
    taxAmount: 15300,
    discountAmount: 3000,
    shippingCost: 5000,
    otherCharges: 2000,
    totalAmount: 104300,
    paymentTerms: '50% Advance',
    paymentMethod: 'Bank Transfer',
    advancePaymentRequired: true,
    advancePaymentPercentage: 50,
    advancePaymentAmount: 52150,
    vendorName: 'Equipment Rentals Inc',
    vendorContactPerson: 'Sunil Verma',
    vendorPhone: '+91 98765 43212',
    vendorEmail: 'sunil@equipmentrentals.com',
    vendorAddress: '456 Equipment Hub, Bangalore - 560002',
    vendorGstNumber: '29FGHIJ5678K1L5',
    taxType: 'GST',
    placeOfSupply: 'Karnataka',
    requestedBy: 3,
    requestedAt: new Date('2024-09-15'),
    approvedBy: 2,
    approvedAt: new Date('2024-09-16'),
    acknowledgedAt: new Date('2024-09-17'),
    vendorPoNumber: 'VPO-2024-055',
    qualityCheckRequired: false,
    invoiceIds: [1],
    createdBy: 3,
    createdAt: new Date('2024-09-15'),
    updatedAt: new Date('2024-10-20'),
  },
  {
    id: 5,
    poNumber: 'PO-2024-005',
    type: PurchaseOrderType.services,
    status: PurchaseOrderStatus.pending,
    deliveryStatus: DeliveryStatus.pending,
    vendorId: 4,
    projectId: 1,
    poDate: new Date('2024-11-01'),
    expectedDeliveryDate: new Date('2024-11-15'),
    deliveryAddress: 'Site A, Metro Line Extension, Bangalore',
    deliveryLocationId: 1,
    lineItems: [
      {
        id: 8,
        description: 'Transport Services - Concrete delivery',
        specifications: 'Transit mixer, 10 trips',
        quantity: 10,
        unit: 'Trips',
        unitPrice: 3500,
        taxRate: 18,
        taxAmount: 6300,
        subtotal: 35000,
        total: 41300,
        quantityReceived: 0,
        quantityPending: 10,
        expectedDeliveryDate: new Date('2024-11-15'),
        destinationLocationId: 1,
      },
    ],
    subtotal: 35000,
    taxAmount: 6300,
    discountAmount: 0,
    shippingCost: 0,
    otherCharges: 500,
    totalAmount: 41800,
    paymentTerms: 'Immediate',
    paymentMethod: 'Cash',
    advancePaymentRequired: false,
    vendorName: 'Transport Services Ltd',
    vendorContactPerson: 'Vijay Singh',
    vendorPhone: '+91 98765 43213',
    vendorEmail: 'vijay@transportservices.com',
    vendorAddress: '321 Transport Nagar, Bangalore - 560004',
    vendorGstNumber: '29RSTUV3456W1X5',
    taxType: 'GST',
    placeOfSupply: 'Karnataka',
    requestedBy: 1,
    requestedAt: new Date('2024-11-01'),
    qualityCheckRequired: false,
    invoiceIds: [],
    createdBy: 1,
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: 6,
    poNumber: 'PO-2024-006',
    type: PurchaseOrderType.materials,
    status: PurchaseOrderStatus.draft,
    deliveryStatus: DeliveryStatus.pending,
    vendorId: 1,
    projectId: 2,
    poDate: new Date('2024-11-05'),
    expectedDeliveryDate: new Date('2024-11-25'),
    deliveryAddress: 'Site B, Highway Expansion Project, Mysore',
    deliveryLocationId: 3,
    lineItems: [
      {
        id: 9,
        description: 'TMT Steel Bars - 20mm',
        specifications: 'Fe500D Grade, 12m length',
        quantity: 40,
        unit: 'Ton',
        unitPrice: 57500,
        taxRate: 18,
        taxAmount: 414000,
        subtotal: 2300000,
        total: 2714000,
        quantityReceived: 0,
        quantityPending: 40,
        expectedDeliveryDate: new Date('2024-11-25'),
        destinationLocationId: 3,
      },
    ],
    subtotal: 2300000,
    taxAmount: 414000,
    discountAmount: 20000,
    shippingCost: 15000,
    otherCharges: 3000,
    totalAmount: 2712000,
    paymentTerms: 'Net 30',
    paymentMethod: 'Bank Transfer',
    advancePaymentRequired: true,
    advancePaymentPercentage: 25,
    advancePaymentAmount: 678000,
    vendorName: 'Steel Solutions Pvt Ltd',
    vendorContactPerson: 'Amit Sharma',
    vendorPhone: '+91 98765 43210',
    vendorEmail: 'amit@steelsolutions.com',
    vendorAddress: '123 Industrial Area, Bangalore - 560001',
    vendorGstNumber: '29ABCDE1234F1Z5',
    taxType: 'GST',
    placeOfSupply: 'Karnataka',
    requestedBy: 3,
    requestedAt: new Date('2024-11-05'),
    qualityCheckRequired: true,
    invoiceIds: [],
    createdBy: 3,
    createdAt: new Date('2024-11-05'),
    updatedAt: new Date('2024-11-05'),
  },
];

export function getPurchaseOrderById(id: number) {
  return mockPurchaseOrders.find(po => po.id === id);
}

// ============================================
// MATERIAL REQUESTS
// ============================================

export const mockMaterialRequests: MaterialRequest[] = [
  {
    id: 1,
    requestNumber: 'MR-2024-001',
    type: MaterialRequestType.project,
    status: MaterialRequestStatus.approved,
    priority: MaterialRequestPriority.high,
    projectId: 1,
    locationId: 1,
    organizationId: 1,
    requestDate: new Date('2024-11-01'),
    requiredByDate: new Date('2024-11-10'),
    lineItems: [
      {
        id: 1,
        description: 'Cement Bags (50kg)',
        specifications: 'Grade 53, OPC Cement',
        quantityRequested: 200,
        quantityApproved: 200,
        quantityFulfilled: 150,
        quantityPending: 50,
        unit: 'bags',
        fulfillmentMethod: FulfillmentMethod.purchase,
        estimatedCost: 600000,
        actualCost: 580000,
        requiredByDate: new Date('2024-11-08'),
        purpose: 'Foundation work - Building A',
      },
      {
        id: 2,
        description: 'Steel TMT Bars (12mm)',
        specifications: 'Fe 500D Grade',
        quantityRequested: 5000,
        quantityApproved: 5000,
        quantityFulfilled: 5000,
        quantityPending: 0,
        unit: 'kg',
        fulfillmentMethod: FulfillmentMethod.fromStock,
        estimatedCost: 350000,
        actualCost: 350000,
        requiredByDate: new Date('2024-11-10'),
        fulfilledDate: new Date('2024-11-05'),
        purpose: 'Column reinforcement',
      },
    ],
    estimatedTotalCost: 950000,
    actualTotalCost: 930000,
    fulfillmentMethod: FulfillmentMethod.mixed,
    partialFulfillmentAllowed: true,
    purchaseOrderIds: [1],
    transferIds: [],
    requestedBy: 5,
    requestedByDepartment: 'Construction',
    contactPhone: '+91 98765 43210',
    contactEmail: 'supervisor@example.com',
    approvedBy: 2,
    approvedAt: new Date('2024-11-02'),
    purpose: 'Site A - Building Construction Phase 1',
    justification: 'Required for foundation and structural work as per project schedule',
    createdBy: 5,
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-05'),
  },
  {
    id: 2,
    requestNumber: 'MR-2024-002',
    type: MaterialRequestType.emergency,
    status: MaterialRequestStatus.underReview,
    priority: MaterialRequestPriority.urgent,
    projectId: 2,
    locationId: 2,
    organizationId: 1,
    requestDate: new Date('2024-11-06'),
    requiredByDate: new Date('2024-11-07'),
    lineItems: [
      {
        id: 3,
        description: 'Safety Helmets',
        specifications: 'ISI marked, adjustable',
        quantityRequested: 50,
        quantityApproved: 0,
        quantityFulfilled: 0,
        quantityPending: 0,
        unit: 'pcs',
        estimatedCost: 25000,
        requiredByDate: new Date('2024-11-07'),
        purpose: 'New workers joining site',
      },
      {
        id: 4,
        description: 'Safety Harnesses',
        specifications: 'Full body harness, EN standard',
        quantityRequested: 20,
        quantityApproved: 0,
        quantityFulfilled: 0,
        quantityPending: 0,
        unit: 'pcs',
        estimatedCost: 60000,
        requiredByDate: new Date('2024-11-07'),
        purpose: 'Height work safety compliance',
      },
    ],
    estimatedTotalCost: 85000,
    actualTotalCost: 0,
    partialFulfillmentAllowed: false,
    purchaseOrderIds: [],
    transferIds: [],
    requestedBy: 8,
    requestedByDepartment: 'Safety',
    contactPhone: '+91 99887 76655',
    contactEmail: 'safety@example.com',
    reviewedBy: 3,
    reviewedAt: new Date('2024-11-06'),
    purpose: 'Emergency safety equipment for new crew',
    justification: 'Urgent requirement as 50 new workers are joining tomorrow',
    notes: 'Please expedite - safety critical',
    tags: ['safety', 'urgent', 'emergency'],
    createdBy: 8,
    createdAt: new Date('2024-11-06'),
    updatedAt: new Date('2024-11-06'),
  },
  {
    id: 3,
    requestNumber: 'MR-2024-003',
    type: MaterialRequestType.maintenance,
    status: MaterialRequestStatus.fulfilled,
    priority: MaterialRequestPriority.medium,
    projectId: 1,
    locationId: 3,
    organizationId: 1,
    requestDate: new Date('2024-10-25'),
    requiredByDate: new Date('2024-11-01'),
    lineItems: [
      {
        id: 5,
        description: 'Hydraulic Oil',
        specifications: 'ISO VG 68',
        quantityRequested: 200,
        quantityApproved: 200,
        quantityFulfilled: 200,
        quantityPending: 0,
        unit: 'liters',
        fulfillmentMethod: FulfillmentMethod.purchase,
        estimatedCost: 40000,
        actualCost: 38000,
        requiredByDate: new Date('2024-11-01'),
        fulfilledDate: new Date('2024-10-30'),
        purpose: 'Excavator maintenance',
      },
    ],
    estimatedTotalCost: 40000,
    actualTotalCost: 38000,
    fulfillmentMethod: FulfillmentMethod.purchase,
    partialFulfillmentAllowed: true,
    purchaseOrderIds: [4],
    transferIds: [],
    requestedBy: 12,
    requestedByDepartment: 'Maintenance',
    contactPhone: '+91 98888 77777',
    contactEmail: 'maintenance@example.com',
    approvedBy: 2,
    approvedAt: new Date('2024-10-26'),
    fulfilledBy: 2,
    fulfilledAt: new Date('2024-10-30'),
    purpose: 'Regular maintenance - Heavy equipment',
    createdBy: 12,
    createdAt: new Date('2024-10-25'),
    updatedAt: new Date('2024-10-30'),
  },
  {
    id: 4,
    requestNumber: 'MR-2024-004',
    type: MaterialRequestType.replenishment,
    status: MaterialRequestStatus.rejected,
    priority: MaterialRequestPriority.low,
    locationId: 1,
    organizationId: 1,
    requestDate: new Date('2024-11-03'),
    requiredByDate: new Date('2024-11-15'),
    lineItems: [
      {
        id: 6,
        description: 'Paint - White Emulsion',
        specifications: '20L cans, weather resistant',
        quantityRequested: 100,
        quantityApproved: 0,
        quantityFulfilled: 0,
        quantityPending: 0,
        unit: 'cans',
        estimatedCost: 150000,
        requiredByDate: new Date('2024-11-15'),
        purpose: 'Stock replenishment',
      },
    ],
    estimatedTotalCost: 150000,
    actualTotalCost: 0,
    partialFulfillmentAllowed: true,
    purchaseOrderIds: [],
    transferIds: [],
    requestedBy: 7,
    requestedByDepartment: 'Procurement',
    contactPhone: '+91 97777 66666',
    contactEmail: 'procurement@example.com',
    rejectedBy: 2,
    rejectedAt: new Date('2024-11-04'),
    rejectionReason: 'Sufficient stock available in Warehouse B. Request transfer instead.',
    purpose: 'Warehouse A stock replenishment',
    createdBy: 7,
    createdAt: new Date('2024-11-03'),
    updatedAt: new Date('2024-11-04'),
  },
  {
    id: 5,
    requestNumber: 'MR-2024-005',
    type: MaterialRequestType.project,
    status: MaterialRequestStatus.partiallyFulfilled,
    priority: MaterialRequestPriority.high,
    projectId: 3,
    locationId: 4,
    organizationId: 1,
    requestDate: new Date('2024-11-04'),
    requiredByDate: new Date('2024-11-12'),
    lineItems: [
      {
        id: 7,
        description: 'Concrete Mix (M25 Grade)',
        specifications: 'Ready mix concrete',
        quantityRequested: 100,
        quantityApproved: 100,
        quantityFulfilled: 60,
        quantityPending: 40,
        unit: 'cubic meters',
        fulfillmentMethod: FulfillmentMethod.purchase,
        estimatedCost: 600000,
        actualCost: 360000,
        requiredByDate: new Date('2024-11-12'),
        purpose: 'Slab casting - Floor 3',
      },
      {
        id: 8,
        description: 'Reinforcement Mesh',
        specifications: '6mm, welded mesh',
        quantityRequested: 500,
        quantityApproved: 500,
        quantityFulfilled: 500,
        quantityPending: 0,
        unit: 'sqm',
        fulfillmentMethod: FulfillmentMethod.transfer,
        sourceLocationId: 1,
        estimatedCost: 200000,
        actualCost: 200000,
        requiredByDate: new Date('2024-11-10'),
        fulfilledDate: new Date('2024-11-08'),
        purpose: 'Slab reinforcement',
      },
    ],
    estimatedTotalCost: 800000,
    actualTotalCost: 560000,
    fulfillmentMethod: FulfillmentMethod.mixed,
    partialFulfillmentAllowed: true,
    purchaseOrderIds: [6],
    transferIds: [1],
    requestedBy: 9,
    requestedByDepartment: 'Construction',
    contactPhone: '+91 96666 55555',
    contactEmail: 'site3@example.com',
    approvedBy: 2,
    approvedAt: new Date('2024-11-05'),
    purpose: 'Bridge Construction - Deck work',
    justification: 'Critical path activity, delay will impact project schedule',
    notes: 'Coordinate delivery with concrete pump availability',
    createdBy: 9,
    createdAt: new Date('2024-11-04'),
    updatedAt: new Date('2024-11-08'),
  },
];

export function getMaterialRequestById(id: number) {
  return mockMaterialRequests.find(mr => mr.id === id);
}

// ============================================
// TRANSFERS
// ============================================

export const mockTransfers: Transfer[] = [
  {
    id: 1,
    transferNumber: 'TRF-2024-001',
    type: TransferType.locationToLocation,
    status: TransferStatus.completed,
    priority: TransferPriority.high,
    sourceLocationId: 1,
    destinationLocationId: 4,
    organizationId: 1,
    materialRequestId: 5,
    requestDate: new Date('2024-11-05'),
    scheduledDate: new Date('2024-11-07'),
    actualTransferDate: new Date('2024-11-07'),
    expectedDeliveryDate: new Date('2024-11-07'),
    actualDeliveryDate: new Date('2024-11-07'),
    lineItems: [
      {
        id: 1,
        description: 'Reinforcement Mesh',
        quantityRequested: 500,
        quantityApproved: 500,
        quantityTransferred: 500,
        unit: 'sqm',
        conditionBefore: 'Good',
        conditionAfter: 'Good',
        unitValue: 400,
        totalValue: 200000,
      },
    ],
    totalValue: 200000,
    transportMethod: 'Truck',
    vehicleNumber: 'KA-01-AB-1234',
    driverName: 'Ravi Kumar',
    driverPhone: '+91 98765 12345',
    transportCost: 5000,
    isTemporary: false,
    requestedBy: 9,
    requestedByDepartment: 'Construction',
    approvedBy: 2,
    approvedAt: new Date('2024-11-06'),
    issuedBy: 4,
    issuedAt: new Date('2024-11-07T08:00:00'),
    receivedBy: 9,
    receivedAt: new Date('2024-11-07T14:30:00'),
    qualityCheckRequired: true,
    qualityCheckPassed: true,
    inspectedBy: 9,
    inspectedAt: new Date('2024-11-07T14:45:00'),
    hasDiscrepancies: false,
    purpose: 'Bridge Construction - Material supply from main warehouse',
    notes: 'All items received in good condition',
    createdBy: 9,
    createdAt: new Date('2024-11-05'),
    updatedAt: new Date('2024-11-07T14:45:00'),
  },
  {
    id: 2,
    transferNumber: 'TRF-2024-002',
    type: TransferType.projectToProject,
    status: TransferStatus.inTransit,
    priority: TransferPriority.medium,
    sourceLocationId: 2,
    destinationLocationId: 3,
    sourceProjectId: 2,
    destinationProjectId: 1,
    organizationId: 1,
    requestDate: new Date('2024-11-06'),
    scheduledDate: new Date('2024-11-08'),
    actualTransferDate: new Date('2024-11-08'),
    expectedDeliveryDate: new Date('2024-11-08'),
    lineItems: [
      {
        id: 2,
        description: 'Scaffolding Pipes',
        quantityRequested: 200,
        quantityApproved: 200,
        quantityTransferred: 200,
        unit: 'pcs',
        conditionBefore: 'Good',
        unitValue: 500,
        totalValue: 100000,
      },
      {
        id: 3,
        description: 'Scaffolding Clamps',
        quantityRequested: 400,
        quantityApproved: 400,
        quantityTransferred: 400,
        unit: 'pcs',
        conditionBefore: 'Good',
        unitValue: 50,
        totalValue: 20000,
      },
    ],
    totalValue: 120000,
    transportMethod: 'Truck',
    vehicleNumber: 'KA-02-CD-5678',
    driverName: 'Suresh Patil',
    driverPhone: '+91 97654 32109',
    transportCost: 3000,
    isTemporary: false,
    requestedBy: 5,
    requestedByDepartment: 'Construction',
    approvedBy: 2,
    approvedAt: new Date('2024-11-07'),
    issuedBy: 8,
    issuedAt: new Date('2024-11-08T09:00:00'),
    qualityCheckRequired: true,
    hasDiscrepancies: false,
    purpose: 'Road project completed, transferring scaffolding to building project',
    notes: 'In transit - ETA 3 hours',
    createdBy: 5,
    createdAt: new Date('2024-11-06'),
    updatedAt: new Date('2024-11-08T09:00:00'),
  },
  {
    id: 3,
    transferNumber: 'TRF-2024-003',
    type: TransferType.returnToStock,
    status: TransferStatus.pending,
    priority: TransferPriority.low,
    sourceLocationId: 3,
    destinationLocationId: 1,
    sourceProjectId: 1,
    organizationId: 1,
    requestDate: new Date('2024-11-07'),
    scheduledDate: new Date('2024-11-09'),
    expectedDeliveryDate: new Date('2024-11-09'),
    lineItems: [
      {
        id: 4,
        description: 'Power Tools Set',
        quantityRequested: 5,
        quantityApproved: 0,
        quantityTransferred: 0,
        unit: 'sets',
        conditionBefore: 'Good',
        unitValue: 15000,
        totalValue: 75000,
        notes: 'Unused tools, returning to warehouse',
      },
      {
        id: 5,
        description: 'Extension Cables (50m)',
        quantityRequested: 10,
        quantityApproved: 0,
        quantityTransferred: 0,
        unit: 'pcs',
        conditionBefore: 'Good',
        unitValue: 2000,
        totalValue: 20000,
      },
    ],
    totalValue: 95000,
    transportMethod: 'Van',
    isTemporary: false,
    requestedBy: 5,
    requestedByDepartment: 'Construction',
    qualityCheckRequired: true,
    hasDiscrepancies: false,
    purpose: 'Returning unused equipment to main warehouse',
    notes: 'Awaiting approval',
    createdBy: 5,
    createdAt: new Date('2024-11-07'),
    updatedAt: new Date('2024-11-07'),
  },
  {
    id: 4,
    transferNumber: 'TRF-2024-004',
    type: TransferType.temporary,
    status: TransferStatus.approved,
    priority: TransferPriority.urgent,
    sourceLocationId: 1,
    destinationLocationId: 2,
    organizationId: 1,
    requestDate: new Date('2024-11-06'),
    scheduledDate: new Date('2024-11-08'),
    expectedDeliveryDate: new Date('2024-11-08'),
    lineItems: [
      {
        id: 6,
        description: 'Concrete Mixer (10/7 CFT)',
        quantityRequested: 2,
        quantityApproved: 2,
        quantityTransferred: 0,
        unit: 'units',
        conditionBefore: 'Good',
        unitValue: 150000,
        totalValue: 300000,
        notes: 'Temporary loan for 1 week',
      },
    ],
    totalValue: 300000,
    transportMethod: 'Flatbed Truck',
    isTemporary: true,
    expectedReturnDate: new Date('2024-11-15'),
    requestedBy: 8,
    requestedByDepartment: 'Construction',
    approvedBy: 2,
    approvedAt: new Date('2024-11-07'),
    qualityCheckRequired: true,
    hasDiscrepancies: false,
    purpose: 'Temporary loan - equipment breakdown at Site B',
    notes: 'Return by Nov 15. Equipment must be maintained properly.',
    createdBy: 8,
    createdAt: new Date('2024-11-06'),
    updatedAt: new Date('2024-11-07'),
  },
  {
    id: 5,
    transferNumber: 'TRF-2024-005',
    type: TransferType.locationToLocation,
    status: TransferStatus.rejected,
    priority: TransferPriority.medium,
    sourceLocationId: 2,
    destinationLocationId: 1,
    organizationId: 1,
    requestDate: new Date('2024-11-05'),
    lineItems: [
      {
        id: 7,
        description: 'Paint - White Emulsion',
        quantityRequested: 50,
        quantityApproved: 0,
        quantityTransferred: 0,
        unit: 'cans',
        unitValue: 1500,
        totalValue: 75000,
      },
    ],
    totalValue: 75000,
    isTemporary: false,
    requestedBy: 7,
    requestedByDepartment: 'Procurement',
    rejectedBy: 3,
    rejectedAt: new Date('2024-11-05'),
    rejectionReason: 'Stock levels at destination are sufficient. Transfer not required.',
    qualityCheckRequired: false,
    hasDiscrepancies: false,
    purpose: 'Stock balancing between warehouses',
    createdBy: 7,
    createdAt: new Date('2024-11-05'),
    updatedAt: new Date('2024-11-05'),
  },
  {
    id: 6,
    transferNumber: 'TRF-2024-006',
    type: TransferType.locationToLocation,
    status: TransferStatus.completed,
    priority: TransferPriority.high,
    sourceLocationId: 1,
    destinationLocationId: 2,
    organizationId: 1,
    requestDate: new Date('2024-10-28'),
    scheduledDate: new Date('2024-10-30'),
    actualTransferDate: new Date('2024-10-30'),
    expectedDeliveryDate: new Date('2024-10-30'),
    actualDeliveryDate: new Date('2024-10-30'),
    lineItems: [
      {
        id: 8,
        description: 'Steel TMT Bars (8mm)',
        quantityRequested: 3000,
        quantityApproved: 3000,
        quantityTransferred: 2950,
        unit: 'kg',
        conditionBefore: 'Good',
        conditionAfter: 'Good',
        unitValue: 70,
        totalValue: 206500,
        notes: '50kg shortage found during receipt',
      },
    ],
    totalValue: 206500,
    transportMethod: 'Truck',
    vehicleNumber: 'KA-03-EF-9012',
    driverName: 'Mahesh Reddy',
    driverPhone: '+91 96543 21098',
    transportCost: 4000,
    isTemporary: false,
    requestedBy: 8,
    requestedByDepartment: 'Construction',
    approvedBy: 2,
    approvedAt: new Date('2024-10-29'),
    issuedBy: 4,
    issuedAt: new Date('2024-10-30T07:00:00'),
    receivedBy: 8,
    receivedAt: new Date('2024-10-30T12:00:00'),
    qualityCheckRequired: true,
    qualityCheckPassed: true,
    inspectedBy: 8,
    inspectedAt: new Date('2024-10-30T12:30:00'),
    hasDiscrepancies: true,
    discrepancyNotes: 'Short delivery: 50kg missing. Possible measurement error or pilferage during transit.',
    discrepancyResolvedBy: 2,
    discrepancyResolvedAt: new Date('2024-10-31'),
    purpose: 'Site B material requirement',
    notes: 'Shortage adjusted in system. Investigation pending.',
    createdBy: 8,
    createdAt: new Date('2024-10-28'),
    updatedAt: new Date('2024-10-31'),
  },
];

export function getTransferById(id: number) {
  return mockTransfers.find(t => t.id === id);
}
export function getAssetById(id: number) {
  return mockAssets.find(asset => asset.id === id);
}
export function getLabourById(id: number) {
  return mockLabour.find((labour) => labour.id === id);
}

export function getVendorById(id: number) {
  return mockVendors.find((vendor) => vendor.id === id);
}

export function getContractById(id: number) {
  return mockContracts.find((contract) => contract.id === id);
}

export { mockUsers } from './data/users';
export { mockOrganizations } from './data/organizations';
export { mockEmployees } from './data/employees';
