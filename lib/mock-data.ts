// lib/comprehensive-mock-data.ts
// Comprehensive mock data for all types in the application

import { User, UserRole } from '@/types/user';
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
  LeaveApprover,
  WorkDelegation,
} from '@/types/leave';

// ═════════════════════════════════════════════════════════════════════════════
// 1. USERS
// ═════════════════════════════════════════════════════════════════════════════

const mockUsers: User[] = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@echno.com',
    phone: '+91 98765 43210',
    address: '123 MG Road, Bangalore, Karnataka 560001',
    gender: 'Male',
    dateOfBirth: new Date('1985-05-15'),
    qualification: 'B.Tech Civil Engineering',
    skills: ['Project Management', 'Structural Design', 'AutoCAD', 'Site Supervision'],
    experience: 15,
    cvUrl: '/cv/rajesh-kumar.pdf',
    emergencyContact: '+91 98765 43211',
    role: UserRole.projectManager,
    profilePictureUrl: '/avatars/rajesh.jpg',
    bloodGroup: 'O+',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya.sharma@echno.com',
    phone: '+91 87654 32109',
    address: '456 Anna Salai, Chennai, Tamil Nadu 600002',
    gender: 'Female',
    dateOfBirth: new Date('1990-08-22'),
    qualification: 'M.Tech Structural Engineering',
    skills: ['Structural Analysis', 'ETABS', 'SAP2000', 'Quality Control'],
    experience: 8,
    cvUrl: '/cv/priya-sharma.pdf',
    emergencyContact: '+91 87654 32110',
    role: UserRole.civilEngineer,
    profilePictureUrl: '/avatars/priya.jpg',
    bloodGroup: 'A+',
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2025-01-08'),
  },
  {
    id: 3,
    name: 'Amit Patel',
    email: 'amit.patel@echno.com',
    phone: '+91 76543 21098',
    address: '789 CG Road, Ahmedabad, Gujarat 380009',
    gender: 'Male',
    dateOfBirth: new Date('1992-03-10'),
    qualification: 'Diploma in Electrical Engineering',
    skills: ['Electrical Installation', 'Wiring', 'Circuit Design', 'Safety Protocols'],
    experience: 6,
    cvUrl: '/cv/amit-patel.pdf',
    emergencyContact: '+91 76543 21099',
    role: UserRole.electrician,
    profilePictureUrl: '/avatars/amit.jpg',
    bloodGroup: 'B+',
    createdAt: new Date('2023-06-10'),
    updatedAt: new Date('2025-01-05'),
  },
  {
    id: 4,
    name: 'Sneha Reddy',
    email: 'sneha.reddy@echno.com',
    phone: '+91 65432 10987',
    address: '321 Banjara Hills, Hyderabad, Telangana 500034',
    gender: 'Female',
    dateOfBirth: new Date('1988-11-05'),
    qualification: 'MBA in Human Resources',
    skills: ['Recruitment', 'Employee Relations', 'Performance Management', 'Payroll'],
    experience: 10,
    cvUrl: '/cv/sneha-reddy.pdf',
    emergencyContact: '+91 65432 10988',
    role: UserRole.hrManager,
    profilePictureUrl: '/avatars/sneha.jpg',
    bloodGroup: 'AB+',
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2025-01-12'),
  },
  {
    id: 5,
    name: 'Vikram Singh',
    email: 'vikram.singh@echno.com',
    phone: '+91 54321 09876',
    address: '567 Park Street, Kolkata, West Bengal 700016',
    gender: 'Male',
    dateOfBirth: new Date('1995-07-18'),
    qualification: 'ITI in Plumbing',
    skills: ['Pipe Fitting', 'Drainage Systems', 'Water Supply', 'Maintenance'],
    experience: 5,
    cvUrl: '/cv/vikram-singh.pdf',
    emergencyContact: '+91 54321 09877',
    role: UserRole.plumber,
    profilePictureUrl: '/avatars/vikram.jpg',
    bloodGroup: 'O-',
    createdAt: new Date('2023-09-15'),
    updatedAt: new Date('2025-01-03'),
  },
  {
    id: 6,
    name: 'Anjali Verma',
    email: 'anjali.verma@echno.com',
    phone: '+91 43210 98765',
    address: '890 Civil Lines, Delhi 110054',
    gender: 'Female',
    dateOfBirth: new Date('1993-02-14'),
    qualification: 'B.Sc Safety Management',
    skills: ['Safety Audits', 'Risk Assessment', 'Emergency Response', 'Training'],
    experience: 7,
    cvUrl: '/cv/anjali-verma.pdf',
    emergencyContact: '+91 43210 98766',
    role: UserRole.safetyOfficer,
    profilePictureUrl: '/avatars/anjali.jpg',
    bloodGroup: 'A-',
    createdAt: new Date('2023-04-22'),
    updatedAt: new Date('2025-01-11'),
  },
  {
    id: 7,
    name: 'Karan Mehta',
    email: 'karan.mehta@echno.com',
    phone: '+91 32109 87654',
    address: '234 FC Road, Pune, Maharashtra 411004',
    gender: 'Male',
    dateOfBirth: new Date('1991-09-28'),
    qualification: 'B.Arch',
    skills: ['Architectural Design', 'Revit', 'SketchUp', '3D Modeling', 'Site Planning'],
    experience: 9,
    cvUrl: '/cv/karan-mehta.pdf',
    emergencyContact: '+91 32109 87655',
    role: UserRole.architect,
    profilePictureUrl: '/avatars/karan.jpg',
    bloodGroup: 'B-',
    createdAt: new Date('2023-05-18'),
    updatedAt: new Date('2025-01-09'),
  },
  {
    id: 8,
    name: 'Divya Iyer',
    email: 'divya.iyer@echno.com',
    phone: '+91 21098 76543',
    address: '678 Residency Road, Bangalore, Karnataka 560025',
    gender: 'Female',
    dateOfBirth: new Date('1994-12-03'),
    qualification: 'B.Com with Accounting Certification',
    skills: ['Financial Reporting', 'Taxation', 'Budgeting', 'Tally', 'Excel'],
    experience: 6,
    cvUrl: '/cv/divya-iyer.pdf',
    emergencyContact: '+91 21098 76544',
    role: UserRole.accountant,
    profilePictureUrl: '/avatars/divya.jpg',
    bloodGroup: 'O+',
    createdAt: new Date('2023-07-25'),
    updatedAt: new Date('2025-01-07'),
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 2. ORGANIZATIONS
// ═════════════════════════════════════════════════════════════════════════════

const mockOrganizations: Organization[] = [
  {
    id: 1,
    organizationName: 'Echno Construction Ltd.',
    organizationAddress: 'Plot No. 45, Andheri East, Mumbai, Maharashtra 400069',
    organizationEmail: 'contact@echno.com',
    organizationPhone: '+91 22 4567 8900',
    organizationWebsite: 'https://echno.com',
    organizationLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=400&fit=crop',
    creatorId: 1,
    createdAt: new Date('2020-01-10'),
    isActive: true,
  },
  {
    id: 2,
    organizationName: 'BuildRight Infrastructure Pvt. Ltd.',
    organizationAddress: 'Sector 62, Noida, Uttar Pradesh 201301',
    organizationEmail: 'info@buildright.com',
    organizationPhone: '+91 120 456 7890',
    organizationWebsite: 'https://buildright.com',
    organizationLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop',
    creatorId: 1,
    createdAt: new Date('2019-06-15'),
    isActive: true,
  },
  {
    id: 3,
    organizationName: 'GreenBuild Constructions',
    organizationAddress: 'Whitefield, Bangalore, Karnataka 560066',
    organizationEmail: 'hello@greenbuild.in',
    organizationPhone: '+91 80 2345 6789',
    organizationWebsite: 'https://greenbuild.in',
    organizationLogo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop',
    creatorId: 4,
    createdAt: new Date('2021-03-20'),
    isActive: true,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// 3. EMPLOYEES
// ═════════════════════════════════════════════════════════════════════════════

const mockEmployees: Employee[] = [
  {
    ...mockUsers[0],
    employeeId: 'EMP001',
    designation: 'Senior Project Manager',
    department: Department.engineering,
    salary: 120000,
    reportingManager: 'CEO',
    shiftTiming: '09:00 - 18:00',
    status: EmployeeStatus.active,
    certifications: ['PMP', 'LEED Green Associate', 'OSHA Safety'],
    joiningDate: new Date('2020-02-01'),
    organizations: [mockOrganizations[0]],
  },
  {
    ...mockUsers[1],
    employeeId: 'EMP002',
    designation: 'Structural Engineer',
    department: Department.engineering,
    salary: 85000,
    reportingManager: 'Rajesh Kumar',
    shiftTiming: '09:00 - 18:00',
    status: EmployeeStatus.active,
    certifications: ['Professional Engineer (PE)', 'LEED AP'],
    joiningDate: new Date('2020-04-15'),
    organizations: [mockOrganizations[0]],
  },
  {
    ...mockUsers[2],
    employeeId: 'EMP003',
    designation: 'Senior Electrician',
    department: Department.engineering,
    salary: 55000,
    reportingManager: 'Rajesh Kumar',
    shiftTiming: '08:00 - 17:00',
    status: EmployeeStatus.active,
    certifications: ['Licensed Electrician', 'NFPA 70E'],
    joiningDate: new Date('2021-01-10'),
    organizations: [mockOrganizations[0]],
  },
  {
    ...mockUsers[3],
    employeeId: 'EMP004',
    designation: 'HR Manager',
    department: Department.humanResources,
    salary: 95000,
    reportingManager: 'CEO',
    shiftTiming: '09:00 - 18:00',
    status: EmployeeStatus.active,
    certifications: ['SHRM-CP', 'PHR'],
    joiningDate: new Date('2020-03-01'),
    organizations: [mockOrganizations[0]],
  },
  {
    ...mockUsers[4],
    employeeId: 'EMP005',
    designation: 'Lead Plumber',
    department: Department.construction,
    salary: 48000,
    reportingManager: 'Site Supervisor',
    shiftTiming: '07:00 - 16:00',
    status: EmployeeStatus.active,
    certifications: ['Licensed Plumber', 'Backflow Prevention'],
    joiningDate: new Date('2021-06-01'),
    organizations: [mockOrganizations[0]],
  },
  {
    ...mockUsers[5],
    employeeId: 'EMP006',
    designation: 'Safety Officer',
    department: Department.safety,
    salary: 72000,
    reportingManager: 'Rajesh Kumar',
    shiftTiming: '08:00 - 17:00',
    status: EmployeeStatus.active,
    certifications: ['OSHA 30-Hour', 'NEBOSH IGC', 'First Aid'],
    joiningDate: new Date('2020-07-15'),
    organizations: [mockOrganizations[0]],
  },
  {
    ...mockUsers[6],
    employeeId: 'EMP007',
    designation: 'Lead Architect',
    department: Department.engineering,
    salary: 105000,
    reportingManager: 'Rajesh Kumar',
    shiftTiming: '09:00 - 18:00',
    status: EmployeeStatus.active,
    certifications: ['Registered Architect', 'LEED AP BD+C'],
    joiningDate: new Date('2020-05-20'),
    organizations: [mockOrganizations[0]],
  },
  {
    ...mockUsers[7],
    employeeId: 'EMP008',
    designation: 'Accountant',
    department: Department.finance,
    salary: 65000,
    reportingManager: 'Finance Head',
    shiftTiming: '09:00 - 18:00',
    status: EmployeeStatus.active,
    certifications: ['CPA', 'Tally Certified'],
    joiningDate: new Date('2021-02-10'),
    organizations: [mockOrganizations[0]],
  },
];

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
    description: 'A hairline crack has been observed in the foundation wall near column C3. Requires immediate structural assessment.',
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
    description: 'The installed electrical panel does not match the approved specifications in the design documents.',
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
    description: 'Visual inspection reveals honeycombing and segregation in the concrete slab at Level 3.',
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
    description: 'Safety barriers are not installed on the 4th floor perimeter. This is a critical safety violation.',
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
    description: 'Structural steel shipment delayed by 2 weeks due to supplier issues.',
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
    description: 'Tower crane experienced mechanical failure. Repair estimated to take 3-4 days.',
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
    tasks: mockTasks.filter(t => t.projectId === 1),
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
    tasks: mockTasks.filter(t => t.projectId === 2),
  },
  {
    id: 3,
    projectName: 'Metro Station - Sector 18',
    projectAddress: 'Sector 18, Noida, Uttar Pradesh 201301',
    status: ProjectStatus.upcoming,
    projectLongitude: 77.3260,
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
    projectLongitude: 73.9190,
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
    salary: 75000,
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
    salary: 45000,
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
    salary: 80000,
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
    Math.pow((employeeLocation.latitude - projectLocation.latitude) * 111000, 2) +
    Math.pow((employeeLocation.longitude - projectLocation.longitude) * 111000, 2)
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
      deviceId: `DEVICE-${Math.random().toString(36).substring(7).toUpperCase()}`,
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
    morningClockIn: createClockEvent(1, ClockEventType.morningClockIn, new Date('2025-01-13'), 8, 55, 1, 'Sunrise Tower', 19.0607, 72.8347),
    lunchBreakStart: createClockEvent(2, ClockEventType.lunchBreakStart, new Date('2025-01-13'), 13, 0, 1, 'Sunrise Tower', 19.0607, 72.8347),
    lunchBreakEnd: createClockEvent(3, ClockEventType.lunchBreakEnd, new Date('2025-01-13'), 14, 0, 1, 'Sunrise Tower', 19.0607, 72.8347),
    eveningClockOut: createClockEvent(4, ClockEventType.eveningClockOut, new Date('2025-01-13'), 18, 10, 1, 'Sunrise Tower', 19.0607, 72.8347),
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
    morningClockIn: createClockEvent(5, ClockEventType.morningClockIn, new Date('2025-01-13'), 9, 30, 1, 'Sunrise Tower', 19.0607, 72.8347),
    lunchBreakStart: createClockEvent(6, ClockEventType.lunchBreakStart, new Date('2025-01-13'), 13, 15, 1, 'Sunrise Tower', 19.0607, 72.8347),
    lunchBreakEnd: createClockEvent(7, ClockEventType.lunchBreakEnd, new Date('2025-01-13'), 14, 10, 1, 'Sunrise Tower', 19.0607, 72.8347),
    eveningClockOut: createClockEvent(8, ClockEventType.eveningClockOut, new Date('2025-01-13'), 18, 30, 1, 'Sunrise Tower', 19.0607, 72.8347),
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
    morningClockIn: createClockEvent(9, ClockEventType.morningClockIn, new Date('2025-01-13'), 8, 5, 1, 'Sunrise Tower', 19.0607, 72.8347),
    lunchBreakStart: createClockEvent(10, ClockEventType.lunchBreakStart, new Date('2025-01-13'), 12, 30, 1, 'Sunrise Tower', 19.0607, 72.8347),
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
    morningClockIn: createClockEvent(11, ClockEventType.morningClockIn, new Date('2025-01-12'), 7, 0, 1, 'Sunrise Tower', 19.0607, 72.8347),
    lunchBreakStart: createClockEvent(12, ClockEventType.lunchBreakStart, new Date('2025-01-12'), 12, 0, 1, 'Sunrise Tower', 19.0607, 72.8347),
    lunchBreakEnd: createClockEvent(13, ClockEventType.lunchBreakEnd, new Date('2025-01-12'), 13, 0, 1, 'Sunrise Tower', 19.0607, 72.8347),
    eveningClockOut: createClockEvent(14, ClockEventType.eveningClockOut, new Date('2025-01-12'), 18, 30, 1, 'Sunrise Tower', 19.0607, 72.8347),
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
    morningClockIn: createClockEvent(15, ClockEventType.morningClockIn, new Date('2025-01-12'), 8, 0, 2, 'Green Valley Residential Complex', 12.9698, 77.7499),
    lunchBreakStart: createClockEvent(16, ClockEventType.lunchBreakStart, new Date('2025-01-12'), 12, 30, 2, 'Green Valley Residential Complex', 12.9698, 77.7499),
    lunchBreakEnd: createClockEvent(17, ClockEventType.lunchBreakEnd, new Date('2025-01-12'), 13, 30, 2, 'Green Valley Residential Complex', 12.9698, 77.7499),
    eveningClockOut: createClockEvent(18, ClockEventType.eveningClockOut, new Date('2025-01-12'), 17, 0, 2, 'Green Valley Residential Complex', 12.9698, 77.7499),
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
    morningClockIn: createClockEvent(19, ClockEventType.morningClockIn, new Date('2025-01-11'), 9, 0, 1, 'Sunrise Tower', 19.0607, 72.8347),
    lunchBreakStart: createClockEvent(20, ClockEventType.lunchBreakStart, new Date('2025-01-11'), 13, 0, 1, 'Sunrise Tower', 19.0607, 72.8347),
    lunchBreakEnd: createClockEvent(21, ClockEventType.lunchBreakEnd, new Date('2025-01-11'), 14, 0, 1, 'Sunrise Tower', 19.0607, 72.8347),
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
    morningClockIn: createClockEvent(22, ClockEventType.morningClockIn, new Date('2025-01-12'), 9, 0, 1, 'Sunrise Tower', 19.0607, 72.8347),
    lunchBreakStart: createClockEvent(23, ClockEventType.lunchBreakStart, new Date('2025-01-12'), 13, 0, 1, 'Sunrise Tower', 19.0607, 72.8347),
    lunchBreakEnd: createClockEvent(24, ClockEventType.lunchBreakEnd, new Date('2025-01-12'), 14, 0, 1, 'Sunrise Tower', 19.0607, 72.8347),
    eveningClockOut: createClockEvent(25, ClockEventType.eveningClockOut, new Date('2025-01-12'), 18, 0, 1, 'Sunrise Tower', 19.0607, 72.8347),
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
    baseSalary: 120000,
    attendanceDeductions: 0,
    overtimePay: 1125,
    netSalary: 121125,
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
    baseSalary: 85000,
    attendanceDeductions: 6954.55,
    overtimePay: 0,
    netSalary: 78045.45,
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
    baseSalary: 55000,
    attendanceDeductions: 5000,
    overtimePay: 0,
    netSalary: 50000,
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
    baseSalary: 48000,
    attendanceDeductions: 0,
    overtimePay: 1227.27,
    netSalary: 49227.27,
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
  mockUsers,
  mockEmployees,
  mockOrganizations,
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
  return mockEmployees.find(emp => emp.id === id);
}

/**
 * Get project by ID
 */
export function getProjectById(id: number): Project | undefined {
  return mockProjects.find(proj => proj.id === id);
}

/**
 * Get tasks for a specific project
 */
export function getTasksForProject(projectId: number): Task[] {
  return mockTasks.filter(task => task.projectId === projectId);
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
  return mockOrganizations.find(org => org.id === id);
}

/**
 * Get all active employees
 */
export function getActiveEmployees(): Employee[] {
  return mockEmployees.filter(emp => emp.status === EmployeeStatus.active);
}

/**
 * Get employees by department
 */
export function getEmployeesByDepartment(department: Department): Employee[] {
  return mockEmployees.filter(emp => emp.department === department);
}

/**
 * Get open issues
 */
export function getOpenIssues(): Issue[] {
  return mockIssues.filter(
    issue => issue.status === IssueStatus.open || issue.status === IssueStatus.inProgress
  );
}

/**
 * Get ongoing tasks
 */
export function getOngoingTasks(): Task[] {
  return mockTasks.filter(task => task.status === TaskStatus.onGoing);
}

/**
 * Get upcoming tasks
 */
export function getUpcomingTasks(): Task[] {
  return mockTasks.filter(task => task.status === TaskStatus.upcoming);
}

/**
 * Get completed tasks
 */
export function getCompletedTasks(): Task[] {
  return mockTasks.filter(task => task.status === TaskStatus.completed);
}

/**
 * Get active invitations
 */
export function getActiveInvitations(): Invitation[] {
  return mockInvitations.filter(inv => {
    if (!inv.expiryDate) return true;
    return inv.expiryDate > new Date();
  });
}

/**
 * Get projects by status
 */
export function getProjectsByStatus(status: ProjectStatus): Project[] {
  return mockProjects.filter(proj => proj.status === status);
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
    att =>
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
    att =>
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
    att => att.date >= startDate && att.date <= endDate
  );
}

/**
 * Get pending attendance regularizations
 */
export function getPendingRegularizations(): Attendance[] {
  return mockAttendance.filter(
    att =>
      att.regularization &&
      att.regularization.status === 'pending'
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
    summary =>
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
    summary => summary.month === month && summary.year === year
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
    att =>
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
    summary =>
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
    summary =>
      summary.month === month &&
      summary.year === year &&
      summary.overtimeDays > 0
  );
}

/**
 * Get project-wise attendance for a date
 */
export function getProjectWiseAttendance(date: Date): Record<number, Attendance[]> {
  const attendanceByProject: Record<number, Attendance[]> = {};
  
  mockAttendance
    .filter(att => att.date.toDateString() === date.toDateString())
    .forEach(att => {
      if (!attendanceByProject[att.projectId]) {
        attendanceByProject[att.projectId] = [];
      }
      attendanceByProject[att.projectId].push(att);
    });

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
    id: "LV-2025-001",
    employeeId: "1",
    employeeName: "Rajesh Kumar",
    employeeEmail: "rajesh.kumar@echno.com",
    department: "Engineering",
    leaveType: LeaveType.earnedLeave,
    fromDate: new Date("2025-01-20"),
    toDate: new Date("2025-01-22"),
    daysCount: 3,
    reason: "Family vacation to Goa",
    status: LeaveStatus.approved,
    appliedAt: new Date("2025-01-10"),
    approvers: [
      {
        id: "APP-001",
        employeeId: "4",
        employeeName: "Sneha Reddy",
        employeeEmail: "sneha.reddy@echno.com",
        role: "HR Manager",
        approvedAt: new Date("2025-01-11"),
        comments: "Approved. Enjoy your vacation!",
      },
    ],
    delegation: {
      delegateToId: "2",
      delegateToName: "Priya Sharma",
      delegateToEmail: "priya.sharma@echno.com",
      responsibilities: "Handle project reviews and client meetings",
      notified: true,
    },
    attachments: [],
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-11"),
  },
  {
    id: "LV-2025-002",
    employeeId: "2",
    employeeName: "Priya Sharma",
    employeeEmail: "priya.sharma@echno.com",
    department: "Engineering",
    leaveType: LeaveType.sickLeave,
    fromDate: new Date("2025-01-15"),
    toDate: new Date("2025-01-16"),
    daysCount: 2,
    reason: "Fever and flu",
    status: LeaveStatus.approved,
    appliedAt: new Date("2025-01-14"),
    approvers: [
      {
        id: "APP-002",
        employeeId: "4",
        employeeName: "Sneha Reddy",
        employeeEmail: "sneha.reddy@echno.com",
        role: "HR Manager",
        approvedAt: new Date("2025-01-14"),
        comments: "Approved. Take rest and get well soon.",
      },
    ],
    attachments: [
      {
        id: "ATT-001",
        fileName: "medical-certificate.pdf",
        fileUrl: "/documents/medical-certificate.pdf",
        fileType: "application/pdf",
        uploadedAt: new Date("2025-01-14"),
      },
    ],
    emergencyContact: "+91 98765 11111",
    createdAt: new Date("2025-01-14"),
    updatedAt: new Date("2025-01-14"),
  },
  {
    id: "LV-2025-003",
    employeeId: "3",
    employeeName: "Amit Patel",
    employeeEmail: "amit.patel@echno.com",
    department: "Electrical",
    leaveType: LeaveType.casualLeave,
    fromDate: new Date("2025-02-05"),
    toDate: new Date("2025-02-05"),
    daysCount: 1,
    reason: "Personal work - bank visit",
    status: LeaveStatus.pending,
    appliedAt: new Date("2025-01-30"),
    approvers: [
      {
        id: "APP-003",
        employeeId: "4",
        employeeName: "Sneha Reddy",
        employeeEmail: "sneha.reddy@echno.com",
        role: "HR Manager",
      },
    ],
    currentApproverId: "4",
    attachments: [],
    createdAt: new Date("2025-01-30"),
    updatedAt: new Date("2025-01-30"),
  },
  {
    id: "LV-2025-004",
    employeeId: "5",
    employeeName: "Vikram Singh",
    employeeEmail: "vikram.singh@echno.com",
    department: "Operations",
    leaveType: LeaveType.paternityLeave,
    fromDate: new Date("2025-02-10"),
    toDate: new Date("2025-02-24"),
    daysCount: 15,
    reason: "Expecting a baby",
    status: LeaveStatus.pending,
    appliedAt: new Date("2025-01-25"),
    approvers: [
      {
        id: "APP-004",
        employeeId: "4",
        employeeName: "Sneha Reddy",
        employeeEmail: "sneha.reddy@echno.com",
        role: "HR Manager",
      },
    ],
    currentApproverId: "4",
    delegation: {
      delegateToId: "6",
      delegateToName: "Ananya Iyer",
      delegateToEmail: "ananya.iyer@echno.com",
      responsibilities: "Manage site operations and coordinate with vendors",
      notified: true,
    },
    attachments: [],
    emergencyContact: "+91 98765 33333",
    createdAt: new Date("2025-01-25"),
    updatedAt: new Date("2025-01-25"),
  },
  {
    id: "LV-2025-005",
    employeeId: "7",
    employeeName: "Karthik Menon",
    employeeEmail: "karthik.menon@echno.com",
    department: "Administration",
    leaveType: LeaveType.casualLeave,
    fromDate: new Date("2025-01-18"),
    toDate: new Date("2025-01-18"),
    daysCount: 1,
    reason: "Wedding anniversary celebration",
    status: LeaveStatus.approved,
    appliedAt: new Date("2025-01-12"),
    approvers: [
      {
        id: "APP-005",
        employeeId: "4",
        employeeName: "Sneha Reddy",
        employeeEmail: "sneha.reddy@echno.com",
        role: "HR Manager",
        approvedAt: new Date("2025-01-13"),
        comments: "Approved. Congratulations!",
      },
    ],
    attachments: [],
    createdAt: new Date("2025-01-12"),
    updatedAt: new Date("2025-01-13"),
  },
  {
    id: "LV-2025-006",
    employeeId: "8",
    employeeName: "Divya Nair",
    employeeEmail: "divya.nair@echno.com",
    department: "Finance",
    leaveType: LeaveType.sickLeave,
    fromDate: new Date("2025-02-15"),
    toDate: new Date("2025-02-17"),
    daysCount: 3,
    reason: "Dental surgery",
    status: LeaveStatus.pending,
    appliedAt: new Date("2025-02-01"),
    approvers: [
      {
        id: "APP-006",
        employeeId: "4",
        employeeName: "Sneha Reddy",
        employeeEmail: "sneha.reddy@echno.com",
        role: "HR Manager",
      },
    ],
    currentApproverId: "4",
    attachments: [
      {
        id: "ATT-002",
        fileName: "dental-appointment.pdf",
        fileUrl: "/documents/dental-appointment.pdf",
        fileType: "application/pdf",
        uploadedAt: new Date("2025-02-01"),
      },
    ],
    emergencyContact: "+91 98765 44444",
    createdAt: new Date("2025-02-01"),
    updatedAt: new Date("2025-02-01"),
  },
  {
    id: "LV-2025-007",
    employeeId: "1",
    employeeName: "Rajesh Kumar",
    employeeEmail: "rajesh.kumar@echno.com",
    department: "Engineering",
    leaveType: LeaveType.earnedLeave,
    fromDate: new Date("2025-03-10"),
    toDate: new Date("2025-03-14"),
    daysCount: 5,
    reason: "Attending cousin's wedding in Delhi",
    status: LeaveStatus.draft,
    appliedAt: new Date("2025-02-05"),
    approvers: [],
    attachments: [],
    createdAt: new Date("2025-02-05"),
    updatedAt: new Date("2025-02-05"),
  },
  {
    id: "LV-2025-008",
    employeeId: "2",
    employeeName: "Priya Sharma",
    employeeEmail: "priya.sharma@echno.com",
    department: "Engineering",
    leaveType: LeaveType.casualLeave,
    fromDate: new Date("2025-01-12"),
    toDate: new Date("2025-01-12"),
    daysCount: 1,
    reason: "House maintenance work",
    status: LeaveStatus.rejected,
    appliedAt: new Date("2025-01-10"),
    approvers: [
      {
        id: "APP-007",
        employeeId: "4",
        employeeName: "Sneha Reddy",
        employeeEmail: "sneha.reddy@echno.com",
        role: "HR Manager",
        rejectedAt: new Date("2025-01-11"),
        comments: "Critical project deadline on this date. Please reschedule.",
      },
    ],
    attachments: [],
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-11"),
  },
];

/**
 * Mock Employee Leave Quotas
 */
export const mockEmployeeLeaveQuotas: EmployeeLeaveQuota[] = [
  {
    employeeId: "1",
    employeeName: "Rajesh Kumar",
    department: "Engineering",
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
    effectiveFrom: new Date("2025-01-01"),
    effectiveTo: new Date("2025-12-31"),
    lastUpdated: new Date("2025-02-05"),
  },
  {
    employeeId: "2",
    employeeName: "Priya Sharma",
    department: "Engineering",
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
    effectiveFrom: new Date("2025-01-01"),
    effectiveTo: new Date("2025-12-31"),
    lastUpdated: new Date("2025-02-05"),
  },
  {
    employeeId: "3",
    employeeName: "Amit Patel",
    department: "Electrical",
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
    effectiveFrom: new Date("2025-01-01"),
    effectiveTo: new Date("2025-12-31"),
    lastUpdated: new Date("2025-02-05"),
  },
  {
    employeeId: "4",
    employeeName: "Sneha Reddy",
    department: "Human Resources",
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
    effectiveFrom: new Date("2025-01-01"),
    effectiveTo: new Date("2025-12-31"),
    lastUpdated: new Date("2025-02-05"),
  },
  {
    employeeId: "5",
    employeeName: "Vikram Singh",
    department: "Operations",
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
    effectiveFrom: new Date("2025-01-01"),
    effectiveTo: new Date("2025-12-31"),
    lastUpdated: new Date("2025-02-05"),
  },
];

/**
 * Get leave requests for an employee
 */
export function getEmployeeLeaveRequests(employeeId: string): LeaveRequest[] {
  return mockLeaveRequests.filter(leave => leave.employeeId === employeeId);
}

/**
 * Get pending leave requests
 */
export function getPendingLeaveRequests(): LeaveRequest[] {
  return mockLeaveRequests.filter(leave => leave.status === LeaveStatus.pending);
}

/**
 * Get leave requests by status
 */
export function getLeaveRequestsByStatus(status: LeaveStatus): LeaveRequest[] {
  return mockLeaveRequests.filter(leave => leave.status === status);
}

/**
 * Get leave requests for approval (for a specific approver)
 */
export function getLeaveRequestsForApproval(approverId: string): LeaveRequest[] {
  return mockLeaveRequests.filter(
    leave => leave.status === LeaveStatus.pending && leave.currentApproverId === approverId
  );
}

/**
 * Get employee leave quota
 */
export function getEmployeeLeaveQuota(employeeId: string, year: number): EmployeeLeaveQuota | undefined {
  return mockEmployeeLeaveQuotas.find(
    quota => quota.employeeId === employeeId && quota.year === year
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
  return quota?.balances.find(balance => balance.leaveType === leaveType);
}

/**
 * Get upcoming leaves (approved leaves in the future)
 */
export function getUpcomingLeaves(): LeaveRequest[] {
  const today = new Date();
  return mockLeaveRequests.filter(
    leave => leave.status === LeaveStatus.approved && leave.fromDate > today
  );
}

/**
 * Get leaves by date range
 */
export function getLeavesByDateRange(fromDate: Date, toDate: Date): LeaveRequest[] {
  return mockLeaveRequests.filter(
    leave =>
      (leave.fromDate >= fromDate && leave.fromDate <= toDate) ||
      (leave.toDate >= fromDate && leave.toDate <= toDate) ||
      (leave.fromDate <= fromDate && leave.toDate >= toDate)
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RESOURCES - INVENTORY, LOCATIONS, ASSETS
// ═════════════════════════════════════════════════════════════════════════════

import { Location, LocationType } from '@/types/resource/location';
import { InventoryItem } from '@/types/resource/inventory';

// Mock Locations
export const mockLocations: Location[] = [
  {
    id: 1,
    name: 'Godown A',
    type: 'godown',
    address: 'Plot No. 45, MIDC Industrial Area, Andheri East, Mumbai - 400093',
    capacity: 5000,
    organizationId: 1,
    isActive: true
  },
  {
    id: 2,
    name: 'Project Site - Gateway Plaza',
    type: 'project-site',
    address: 'Bandra West, Mumbai - 400050',
    capacity: 2000,
    organizationId: 1,
    projectId: 1,
    isActive: true
  },
  {
    id: 3,
    name: 'Head Office Warehouse',
    type: 'head-office',
    address: 'Powai, Mumbai - 400076',
    capacity: 1000,
    organizationId: 1,
    isActive: true
  },
  {
    id: 4,
    name: 'Godown B - Navi Mumbai',
    type: 'godown',
    address: 'Sector 11, Vashi, Navi Mumbai - 400703',
    capacity: 8000,
    organizationId: 1,
    isActive: true
  },
  {
    id: 5,
    name: 'Project Site - Marina Heights',
    type: 'project-site',
    address: 'Worli Sea Face, Mumbai - 400018',
    capacity: 1500,
    organizationId: 1,
    projectId: 2,
    isActive: true
  },
  {
    id: 6,
    name: 'Thane Warehouse',
    type: 'warehouse',
    address: 'Ghodbunder Road, Thane - 400607',
    capacity: 3000,
    organizationId: 1,
    isActive: true
  },
  {
    id: 7,
    name: 'Project Site - Emerald Tower',
    type: 'project-site',
    address: 'Parel, Mumbai - 400012',
    capacity: 1200,
    organizationId: 1,
    projectId: 3,
    isActive: false
  },
  {
    id: 8,
    name: 'Godown C - Panvel',
    type: 'godown',
    address: 'MIDC Industrial Area, Panvel, Navi Mumbai - 410206',
    capacity: 6000,
    organizationId: 1,
    isActive: true
  },
  {
    id: 9,
    name: 'Project Site - Crystal Towers',
    type: 'project-site',
    address: 'Lower Parel, Mumbai - 400013',
    capacity: 1800,
    organizationId: 1,
    projectId: 4,
    isActive: true
  },
  {
    id: 10,
    name: 'Kalyan Warehouse',
    type: 'warehouse',
    address: 'Kalyan Bhiwandi Road, Kalyan - 421306',
    capacity: 4500,
    organizationId: 1,
    isActive: true
  },
  {
    id: 11,
    name: 'Project Site - Skyline Residency',
    type: 'project-site',
    address: 'Malad West, Mumbai - 400064',
    capacity: 1600,
    organizationId: 1,
    projectId: 5,
    isActive: true
  },
  {
    id: 12,
    name: 'Regional Office - Pune',
    type: 'head-office',
    address: 'Hinjewadi IT Park, Phase 1, Pune - 411057',
    capacity: 800,
    organizationId: 1,
    isActive: true
  },
  {
    id: 13,
    name: 'Godown D - Turbhe',
    type: 'godown',
    address: 'MIDC Turbhe, Navi Mumbai - 400705',
    capacity: 7000,
    organizationId: 1,
    isActive: true
  },
  {
    id: 14,
    name: 'Project Site - Grand Palladium',
    type: 'project-site',
    address: 'Andheri West, Mumbai - 400053',
    capacity: 2200,
    organizationId: 1,
    projectId: 6,
    isActive: true
  },
  {
    id: 15,
    name: 'Borivali Warehouse',
    type: 'warehouse',
    address: 'Industrial Estate, Borivali East, Mumbai - 400066',
    capacity: 3500,
    organizationId: 1,
    isActive: true
  }
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
  15: 4
};

// Helper function to get location by ID
export function getLocationById(id: number): Location | undefined {
  return mockLocations.find(loc => loc.id === id);
}

// Mock Inventory Items
export const mockInventoryItems: InventoryItem[] = [
  {
    id: 1,
    itemId: 'INV-001',
    name: 'Portland Cement - Grade 53',
    description: 'High-grade cement for structural concrete work. Suitable for all types of construction including high-rise buildings, bridges, and industrial structures.',
    category: 'cement',
    quantity: 450,
    unit: 'bags',
    minStockLevel: 200,
    maxStockLevel: 1000,
    reorderPoint: 250,
    locationId: 1,
    location: mockLocations[0],
    unitPrice: 350,
    totalValue: 157500,
    vendorId: 1, // UltraTech Cement Ltd.
    brand: 'UltraTech',
    specifications: {
      grade: '53',
      packagingSize: '50 kg',
      compressiveStrength: '53 MPa',
      standard: 'IS 12269:2013'
    },
    batchNumber: 'UT-2024-11-001',
    lastRestockedDate: new Date('2024-10-25'),
    notes: 'Store in dry conditions. Keep away from moisture.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-10-25')
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
    totalValue: 67500,
    vendorId: 2, // Tata Steel
    brand: 'Tata Tiscon',
    batchNumber: 'TS-12MM-2024-045',
    lastRestockedDate: new Date('2024-11-01'),
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-11-01')
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
    totalValue: 30000,
    vendorId: 3, // Mumbai Aggregates
    notes: 'Low stock - urgent reorder needed',
    lastRestockedDate: new Date('2024-10-15'),
    lastUsedDate: new Date('2024-11-05'),
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-11-05')
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
    maxStockLevel: 10000,
    reorderPoint: 3000,
    locationId: 2,
    location: mockLocations[1],
    unitPrice: 8,
    totalValue: 40000,
    vendorId: 1, // Maharashtra Brick Works
    brand: 'Premium Clay',
    batchNumber: 'MBW-2024-10-025',
    lastRestockedDate: new Date('2024-10-20'),
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-10-20')
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
    updatedAt: new Date('2024-11-05')
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
    totalValue: 50400,
    vendorId: 5, // Supreme Industries
    brand: 'Supreme',
    batchNumber: 'SUP-4IN-2024-08',
    lastRestockedDate: new Date('2024-09-15'),
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-09-15')
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
    totalValue: 54000,
    vendorId: 1, // Birla White
    brand: 'Birla White',
    batchNumber: 'BW-2024-10-015',
    lastRestockedDate: new Date('2024-10-15'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-10-15')
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
    totalValue: 95000,
    vendorId: 2, // Kajaria Ceramics
    brand: 'Kajaria',
    batchNumber: 'KAJ-GT-2024-09',
    lastRestockedDate: new Date('2024-09-25'),
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-09-25')
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
    totalValue: 26100,
    vendorId: 3, // Asian Paints
    brand: 'Asian Paints',
    batchNumber: 'AP-TE-2024-10',
    lastRestockedDate: new Date('2024-10-05'),
    createdAt: new Date('2024-04-15'),
    updatedAt: new Date('2024-10-05')
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
    totalValue: 30400,
    vendorId: 4, // Philips India
    brand: 'Philips',
    batchNumber: 'PH-LED-2024-10',
    lastRestockedDate: new Date('2024-10-12'),
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-10-12')
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
    totalValue: 15300,
    vendorId: 5, // Karam Industries
    brand: 'Karam',
    batchNumber: 'KI-SH-2024-08',
    lastRestockedDate: new Date('2024-08-20'),
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-08-20')
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
    totalValue: 136400,
    vendorId: 2, // JSW Steel
    brand: 'JSW Neosteel',
    batchNumber: 'JSW-16MM-2024-09',
    lastRestockedDate: new Date('2024-09-10'),
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-09-10')
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
    totalValue: 36250,
    vendorId: 1, // Godrej supplier: 'Godrej & Boyce', Boyce
    brand: 'Godrej',
    batchNumber: 'GB-DH-2024-07',
    lastRestockedDate: new Date('2024-07-15'),
    createdAt: new Date('2024-06-10'),
    updatedAt: new Date('2024-07-15')
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
    totalValue: 153000,
    vendorId: 2, // Johnson Tiles
    brand: 'Johnson',
    batchNumber: 'JT-MT-2024-08',
    lastRestockedDate: new Date('2024-08-25'),
    createdAt: new Date('2024-04-20'),
    updatedAt: new Date('2024-08-25')
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
    totalValue: 97500,
    vendorId: 3, // Mumbai Aggregates
    batchNumber: 'MA-20MM-2024-10',
    lastRestockedDate: new Date('2024-10-08'),
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-10-08')
  }
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
    notes: 'Monthly stock replenishment'
  },
  {
    id: 2,
    date: new Date('2024-10-20'),
    type: 'usage' as const,
    quantity: -50,
    previousQuantity: 300,
    newQuantity: 250,
    performedBy: 'Site Manager',
    notes: 'Used for Gateway Plaza project'
  },
  {
    id: 3,
    date: new Date('2024-10-15'),
    type: 'adjustment' as const,
    quantity: -10,
    previousQuantity: 310,
    newQuantity: 300,
    performedBy: 'Warehouse Admin',
    notes: 'Stock audit adjustment - damaged bags removed'
  },
  {
    id: 4,
    date: new Date('2024-09-28'),
    type: 'restock' as const,
    quantity: 150,
    previousQuantity: 160,
    newQuantity: 310,
    performedBy: 'Rajesh Kumar',
    notes: 'Regular procurement'
  }
];

// Helper function to get inventory item by ID
export function getInventoryItemById(id: number): InventoryItem | undefined {
  return mockInventoryItems.find(item => item.id === id);
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
    notes: 'Experienced mason with excellent work quality. Punctual and reliable.',
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
    monthlyRate: 25000,
    currentProject: 'Residential Complex',
    joiningDate: new Date('2024-02-01'),
    totalWorkDays: 165,
    totalDue: 12000,
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
    monthlyRate: 28000,
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
    totalPurchaseValue: 5800000,
    totalOutstanding: 280000,
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
    totalPurchaseValue: 4200000,
    totalOutstanding: 150000,
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
    totalPurchaseValue: 3600000,
    totalOutstanding: 420000,
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
    totalPurchaseValue: 1800000,
    totalOutstanding: 95000,
    paymentTerms: 'immediate',
    rating: 4.0,
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
    totalPurchaseValue: 850000,
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
    contractValue: 8500000,
    totalPaid: 5100000,
    totalDue: 3400000,
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
    contractValue: 4200000,
    totalPaid: 2940000,
    totalDue: 1260000,
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
    contractValue: 3600000,
    totalPaid: 2160000,
    totalDue: 1440000,
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
    contractValue: 5200000,
    totalPaid: 1040000,
    totalDue: 4160000,
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
    contractValue: 2800000,
    totalPaid: 2800000,
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
export function getLabourById(id: number) {
  return mockLabour.find(labour => labour.id === id);
}

export function getVendorById(id: number) {
  return mockVendors.find(vendor => vendor.id === id);
}

export function getContractById(id: number) {
  return mockContracts.find(contract => contract.id === id);
}
