// Employee types and interfaces for the web application

export enum EmployeeStatus {
  active = 'active',
  inactive = 'inactive',
  onLeave = 'onLeave',
  terminated = 'terminated',
  resigned = 'resigned',
  probation = 'probation',
  suspended = 'suspended',
}

export enum Department {
  engineering = 'engineering',
  construction = 'construction',
  safety = 'safety',
  quality = 'quality',
  administration = 'administration',
  humanResources = 'humanResources',
  finance = 'finance',
  procurement = 'procurement',
  planning = 'planning',
  maintenance = 'maintenance',
  security = 'security',
  operations = 'operations',
  it = 'it',
  legal = 'legal',
  marketing = 'marketing',
}

export interface Organization {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  managerId?: string;
  teamMembers?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  address: string;
  bloodGroup?: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  qualification: string;
  skills?: string[];
  experience?: number;
  cvUrl?: string;
  emergencyContact?: string;
  organizations?: Organization[];
  role: string;
  profilePictureUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee extends User {
  employeeId: string;
  designation: string;
  department: string;
  salary?: number;
  reportingManager?: string;
  shiftTiming?: string;
  status: EmployeeStatus;
  certifications?: string[];
  joiningDate?: string;
  currentProjects?: Project[];
}

// Utility functions for Employee
export class EmployeeUtils {
  static fromUser(
    user: User,
    employeeData: {
      employeeId: string;
      designation: string;
      department: string;
      joiningDate?: string;
      salary?: number;
      reportingManager?: string;
      shiftTiming?: string;
      status?: EmployeeStatus;
      certifications?: string[];
      currentProjects?: Project[];
    }
  ): Employee {
    return {
      ...user,
      ...employeeData,
      status: employeeData.status || EmployeeStatus.active,
    };
  }

  static fromJson(json: any): Employee {
    return {
      id: json.id || '',
      name: json.name || json.employeeName || '',
      address: json.address || '',
      bloodGroup: json.bloodGroup,
      email: json.email || json.emailAddress || '',
      phone: json.phone || json.phoneNumber || '',
      gender: json.gender || '',
      dateOfBirth: json.dateOfBirth || new Date().toISOString(),
      qualification: json.qualification || '',
      skills: json.skills ? Array.from(json.skills) : undefined,
      experience: json.experience,
      cvUrl: json.cvUrl,
      emergencyContact: json.emergencyContact,
      organizations: json.organizations
        ? json.organizations.map((org: any) => ({
            id: org.id,
            name: org.name,
            description: org.description,
            createdAt: org.createdAt,
            updatedAt: org.updatedAt,
          }))
        : undefined,
      role: json.role || 'laborer',
      profilePictureUrl: json.profilePictureUrl,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      employeeId: json.employeeId || '',
      designation: json.designation || '',
      department: json.department || '',
      joiningDate: json.joiningDate,
      salary: json.salary,
      reportingManager: json.reportingManager,
      shiftTiming: json.shiftTiming,
      status: json.status ? EmployeeStatus[json.status as keyof typeof EmployeeStatus] : EmployeeStatus.active,
      certifications: json.certifications ? Array.from(json.certifications) : undefined,
      currentProjects: json.currentProjects
        ? json.currentProjects.map((project: any) => ({
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
            managerId: project.managerId,
            teamMembers: project.teamMembers,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          }))
        : undefined,
    };
  }

  static toJson(employee: Employee): any {
    const userJson = {
      id: employee.id,
      name: employee.name,
      address: employee.address,
      bloodGroup: employee.bloodGroup,
      email: employee.email,
      phone: employee.phone,
      gender: employee.gender,
      dateOfBirth: employee.dateOfBirth,
      qualification: employee.qualification,
      skills: employee.skills,
      experience: employee.experience,
      cvUrl: employee.cvUrl,
      emergencyContact: employee.emergencyContact,
      organizations: employee.organizations,
      role: employee.role,
      profilePictureUrl: employee.profilePictureUrl,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };

    return {
      ...userJson,
      employeeId: employee.employeeId,
      designation: employee.designation,
      department: employee.department,
      joiningDate: employee.joiningDate,
      salary: employee.salary,
      reportingManager: employee.reportingManager,
      shiftTiming: employee.shiftTiming,
      status: employee.status,
      certifications: employee.certifications,
      currentProjects: employee.currentProjects?.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        managerId: project.managerId,
        teamMembers: project.teamMembers,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
    };
  }

  static getDisplayName(employee: Employee): string {
    return `${employee.name} (${employee.employeeId})`;
  }

  static getYearsOfService(employee: Employee): number {
    if (!employee.joiningDate) return 0;
    const joiningDate = new Date(employee.joiningDate);
    const now = new Date();
    return now.getFullYear() - joiningDate.getFullYear();
  }

  static isActive(employee: Employee): boolean {
    return employee.status === EmployeeStatus.active;
  }

  static copyWith(employee: Employee, updates: Partial<Employee>): Employee {
    return {
      ...employee,
      ...updates,
    };
  }

  static getPrimaryOrganization(employee: Employee): Organization | undefined {
    return employee.organizations?.[0];
  }

  static worksForOrganization(employee: Employee, organizationId: number): boolean {
    return employee.organizations?.some(org => org.id === organizationId) || false;
  }
}

// Extension methods for enums
export const EmployeeStatusExtensions = {
  displayName: (status: EmployeeStatus): string => {
    switch (status) {
      case EmployeeStatus.active: return 'Active';
      case EmployeeStatus.inactive: return 'Inactive';
      case EmployeeStatus.onLeave: return 'On Leave';
      case EmployeeStatus.terminated: return 'Terminated';
      case EmployeeStatus.resigned: return 'Resigned';
      case EmployeeStatus.probation: return 'Probation';
      case EmployeeStatus.suspended: return 'Suspended';
    }
  },

  colorHex: (status: EmployeeStatus): string => {
    switch (status) {
      case EmployeeStatus.active: return '#4CAF50'; // Green
      case EmployeeStatus.inactive: return '#9E9E9E'; // Grey
      case EmployeeStatus.onLeave: return '#FF9800'; // Orange
      case EmployeeStatus.terminated: return '#F44336'; // Red
      case EmployeeStatus.resigned: return '#E91E63'; // Pink
      case EmployeeStatus.probation: return '#2196F3'; // Blue
      case EmployeeStatus.suspended: return '#795548'; // Brown
    }
  },
};

export const DepartmentExtensions = {
  displayName: (department: Department): string => {
    switch (department) {
      case Department.engineering: return 'Engineering';
      case Department.construction: return 'Construction';
      case Department.safety: return 'Safety';
      case Department.quality: return 'Quality';
      case Department.administration: return 'Administration';
      case Department.humanResources: return 'Human Resources';
      case Department.finance: return 'Finance';
      case Department.procurement: return 'Procurement';
      case Department.planning: return 'Planning';
      case Department.maintenance: return 'Maintenance';
      case Department.security: return 'Security';
      case Department.operations: return 'Operations';
      case Department.it: return 'IT';
      case Department.legal: return 'Legal';
      case Department.marketing: return 'Marketing';
    }
  },
};