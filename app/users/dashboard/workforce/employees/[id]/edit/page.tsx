'use client';

import { notFound, useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { mockEmployees } from '@/components/shared/mock-data';
import { AppLayout } from '@/components/common/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Briefcase,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  Shield,
  Award,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Droplet,
  GraduationCap,
  Users as UsersIcon,
  UserCircle,
  FileText,
} from 'lucide-react';
import { Department, getDepartmentLabel } from '@/types/employee/departments';
import {
  EmployeeStatus,
  getEmployeeStatusLabel,
} from '@/types/employee/employee-status';
import { UserRole } from '@/types/user/user-role';
import { format } from 'date-fns';
import { toast } from '@/lib/styles/toast-styles';

interface EditEmployeePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditEmployeePage({ params }: EditEmployeePageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const employee = mockEmployees.find(
    (emp) => emp.id === Number.parseInt(resolvedParams.id)
  );

  if (!employee) {
    notFound();
  }

  // Form state
  const [formData, setFormData] = useState({
    // Personal Information
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    gender: employee.gender,
    dateOfBirth: employee.dateOfBirth
      ? format(employee.dateOfBirth, 'yyyy-MM-dd')
      : '',
    bloodGroup: employee.bloodGroup || '',
    address: employee.address,
    emergencyContact: employee.emergencyContact || '',

    // Professional Information
    employeeId: employee.employeeId,
    designation: employee.designation,
    department: employee.department,
    qualification: employee.qualification,
    experience: employee.experience?.toString() || '',
    skills: employee.skills?.join(', ') || '',

    // Employment Details
    joiningDate: employee.joiningDate
      ? format(employee.joiningDate, 'yyyy-MM-dd')
      : '',
    status: employee.status,
    salary: employee.salary?.toString() || '',
    reportingManager: employee.reportingManager || '',
    shiftTiming: employee.shiftTiming || '',
    role: employee.roles?.[0] || '',

    // Additional
    certifications: employee.certifications?.join(', ') || '',
    cvUrl: employee.cvUrl || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Employee Updated', {
        description: `${formData.name}'s information has been updated successfully.`,
      });
      setIsSubmitting(false);
      router.push(`/dashboard/workforce/employees/${resolvedParams.id}`);
    }, 1000);
  };

  const handleCancel = () => {
    router.push(`/dashboard/workforce/employees/${resolvedParams.id}`);
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Edit Employee
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Update {employee.name}&apos;s information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>
                  Basic personal details of the employee
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <UserCircle className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="name"
                        placeholder="Enter full name"
                        className="pl-9"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        className="pl-9"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="phone"
                        placeholder="+1 234 567 8900"
                        className="pl-9"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gender">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        setFormData({ ...formData, gender: value })
                      }
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        className="pl-9"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfBirth: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <div className="relative">
                      <Droplet className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="bloodGroup"
                        placeholder="e.g., A+, B-, O+"
                        className="pl-9"
                        value={formData.bloodGroup}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bloodGroup: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                    <Textarea
                      id="address"
                      placeholder="Enter full address"
                      rows={2}
                      className="pl-9"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <div className="relative">
                    <Phone className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                    <Input
                      id="emergencyContact"
                      placeholder="Emergency contact number"
                      className="pl-9"
                      value={formData.emergencyContact}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContact: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>Professional Information</span>
                </CardTitle>
                <CardDescription>
                  Job-related details and qualifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="employeeId">
                      Employee ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="employeeId"
                      placeholder="EMP-001"
                      value={formData.employeeId}
                      onChange={(e) =>
                        setFormData({ ...formData, employeeId: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="designation">
                      Designation <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="designation"
                        placeholder="e.g., Senior Engineer"
                        className="pl-9"
                        value={formData.designation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            designation: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="department">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          department: value as Department,
                        })
                      }
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Department).map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {getDepartmentLabel(dept)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="qualification">Qualification</Label>
                    <div className="relative">
                      <GraduationCap className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="qualification"
                        placeholder="e.g., B.Tech in Civil Engineering"
                        className="pl-9"
                        value={formData.qualification}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            qualification: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="experience">Experience (Years)</Label>
                    <Input
                      id="experience"
                      type="number"
                      placeholder="e.g., 5"
                      min="0"
                      step="0.1"
                      value={formData.experience}
                      onChange={(e) =>
                        setFormData({ ...formData, experience: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="cvUrl">CV/Resume URL</Label>
                    <div className="relative">
                      <FileText className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="cvUrl"
                        placeholder="https://example.com/cv.pdf"
                        className="pl-9"
                        value={formData.cvUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, cvUrl: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Textarea
                    id="skills"
                    placeholder="e.g., AutoCAD, Project Management, Site Supervision"
                    rows={2}
                    value={formData.skills}
                    onChange={(e) =>
                      setFormData({ ...formData, skills: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="certifications">
                    Certifications (comma-separated)
                  </Label>
                  <div className="relative">
                    <Award className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                    <Textarea
                      id="certifications"
                      placeholder="e.g., PMP, Safety Officer Level 2"
                      rows={2}
                      className="pl-9"
                      value={formData.certifications}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          certifications: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Employment Details</span>
                </CardTitle>
                <CardDescription>
                  Employment status, salary, and reporting structure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="joiningDate">Joining Date</Label>
                    <div className="relative">
                      <Calendar className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="joiningDate"
                        type="date"
                        className="pl-9"
                        value={formData.joiningDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            joiningDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">
                      Employment Status <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          status: value as EmployeeStatus,
                        })
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(EmployeeStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {getEmployeeStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="salary">Monthly Salary</Label>
                    <div className="relative">
                      <DollarSign className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="salary"
                        type="number"
                        placeholder="e.g., 50000"
                        className="pl-9"
                        min="0"
                        value={formData.salary}
                        onChange={(e) =>
                          setFormData({ ...formData, salary: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reportingManager">Reporting Manager</Label>
                    <div className="relative">
                      <UsersIcon className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="reportingManager"
                        placeholder="Manager's name"
                        className="pl-9"
                        value={formData.reportingManager}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reportingManager: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="shiftTiming">Shift Timing</Label>
                    <div className="relative">
                      <Clock className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="shiftTiming"
                        placeholder="e.g., 9:00 AM - 6:00 PM"
                        className="pl-9"
                        value={formData.shiftTiming}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shiftTiming: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="role">
                      System Role <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Shield className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                      <Select
                        value={formData.role}
                        onValueChange={(value) =>
                          setFormData({ ...formData, role: value as UserRole })
                        }
                      >
                        <SelectTrigger id="role" className="pl-9">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.projectManager}>
                            Project Manager
                          </SelectItem>
                          <SelectItem value={UserRole.siteManager}>
                            Site Manager
                          </SelectItem>
                          <SelectItem value={UserRole.supervisor}>
                            Supervisor
                          </SelectItem>
                          <SelectItem value={UserRole.foreman}>
                            Foreman
                          </SelectItem>
                          <SelectItem value={UserRole.civilEngineer}>
                            Civil Engineer
                          </SelectItem>
                          <SelectItem value={UserRole.siteEngineer}>
                            Site Engineer
                          </SelectItem>
                          <SelectItem value={UserRole.structuralEngineer}>
                            Structural Engineer
                          </SelectItem>
                          <SelectItem value={UserRole.architect}>
                            Architect
                          </SelectItem>
                          <SelectItem value={UserRole.safetyOfficer}>
                            Safety Officer
                          </SelectItem>
                          <SelectItem value={UserRole.planningEngineer}>
                            Planning Engineer
                          </SelectItem>
                          <SelectItem value={UserRole.quantitySurveyor}>
                            Quantity Surveyor
                          </SelectItem>
                          <SelectItem value={UserRole.technicalCoordinator}>
                            Technical Coordinator
                          </SelectItem>
                          <SelectItem value={UserRole.hrManager}>
                            HR Manager
                          </SelectItem>
                          <SelectItem value={UserRole.accountant}>
                            Accountant
                          </SelectItem>
                          <SelectItem value={UserRole.adminStaff}>
                            Admin Staff
                          </SelectItem>
                          <SelectItem value={UserRole.documentController}>
                            Document Controller
                          </SelectItem>
                          <SelectItem value={UserRole.itSupport}>
                            IT Support
                          </SelectItem>
                          <SelectItem value={UserRole.laborer}>
                            Laborer
                          </SelectItem>
                          <SelectItem value={UserRole.electrician}>
                            Electrician
                          </SelectItem>
                          <SelectItem value={UserRole.plumber}>
                            Plumber
                          </SelectItem>
                          <SelectItem value={UserRole.carpenter}>
                            Carpenter
                          </SelectItem>
                          <SelectItem value={UserRole.mason}>Mason</SelectItem>
                          <SelectItem value={UserRole.welder}>
                            Welder
                          </SelectItem>
                          <SelectItem value={UserRole.painter}>
                            Painter
                          </SelectItem>
                          <SelectItem value={UserRole.contractor}>
                            Contractor
                          </SelectItem>
                          <SelectItem value={UserRole.subcontractor}>
                            Subcontractor
                          </SelectItem>
                          <SelectItem value={UserRole.consultant}>
                            Consultant
                          </SelectItem>
                          <SelectItem value={UserRole.client}>
                            Client
                          </SelectItem>
                          <SelectItem value={UserRole.intern}>
                            Intern
                          </SelectItem>
                          <SelectItem value={UserRole.trainee}>
                            Trainee
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
