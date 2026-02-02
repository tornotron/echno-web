import { User } from '@/types/user/user';
import {
  formatDate,
  formatDateShort,
  calculateAge,
  formatPhoneNumber,
  formatEmail,
  getRoleDisplayName,
  formatExperience,
  getProfileCompletionPercentage,
  hasProfessionalInfo,
  getCompletionColor,
} from '@/lib/utils/user-profile-utils';
import { UserAvatar } from './user-avatar';
import { ProfileCard, InfoField, InfoGrid, DataList } from './profile-cards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  User as UserIcon,
  Briefcase,
  GraduationCap,
  Award,
  Building2,
  Clock,
  FileText,
  AlertCircle,
  Users,
} from 'lucide-react';
import {
  UserGroupBadge,
  UserGroupList,
} from '@/components/rbac/user-group-badge';

interface UserProfileViewProps {
  user: User;
  onEdit?: () => void;
  showEditButton?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export function UserProfileView({
  user,
  onEdit,
  showEditButton = false,
  className,
}: UserProfileViewProps) {
  const completionPercentage = getProfileCompletionPercentage(user);
  const age = calculateAge(user.dateOfBirth);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Profile Header */}
      <ProfileCard
        title="Profile Overview"
        variant="gradient"
        className="border-none shadow-lg"
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <UserAvatar
            user={user}
            size="xl"
            className="ring-background shadow-xl ring-4"
          />

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {user.name}
                </h1>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{formatEmail(user.email)}</span>
                  </div>
                  {user.phone && user.phone !== 'Not Specified' && (
                    <>
                      <Separator
                        orientation="vertical"
                        className="hidden h-4 sm:block"
                      />
                      <div className="text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">
                          {formatPhoneNumber(user.phone)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Badge variant="default" className="text-xs">
                    {getRoleDisplayName(user.roles?.[0] || '')}
                  </Badge>
                  <UserGroupBadge size="sm" showIcon />
                  {user.experience !== undefined && user.experience > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Briefcase className="mr-1 h-3 w-3" />
                      {formatExperience(user.experience)}
                    </Badge>
                  )}
                </div>
              </div>

              {showEditButton && onEdit && (
                <Button onClick={onEdit} variant="outline" size="sm">
                  Edit Profile
                </Button>
              )}
            </div>

            {/* Profile Completion Bar */}
            <div className="bg-muted/50 mt-6 space-y-2 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Profile Completion</span>
                <span
                  className={cn(
                    'font-bold',
                    getCompletionColor(completionPercentage)
                  )}
                >
                  {completionPercentage}%
                </span>
              </div>
              <div className="bg-secondary h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    completionPercentage >= 80
                      ? 'bg-green-500'
                      : completionPercentage >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  )}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              {completionPercentage < 100 && (
                <p className="text-muted-foreground flex items-center gap-1 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  Complete your profile to unlock all features
                </p>
              )}
            </div>
          </div>
        </div>
      </ProfileCard>

      {/* Information Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <ProfileCard
          title="Personal Information"
          description="Your basic personal details"
          icon={<UserIcon className="h-5 w-5" />}
        >
          <InfoGrid columns={2}>
            <InfoField
              label="Full Name"
              value={user.name}
              icon={<UserIcon className="h-4 w-4" />}
            />
            <InfoField label="Gender" value={user.gender} />
            <InfoField
              label="Date of Birth"
              value={formatDate(user.dateOfBirth)}
              icon={<Calendar className="h-4 w-4" />}
            />
            <InfoField label="Age" value={age ? `${age} years` : undefined} />
            <InfoField label="Blood Group" value={user.bloodGroup} />
            <InfoField
              label="Address"
              value={user.address}
              icon={<MapPin className="h-4 w-4" />}
              className="sm:col-span-2"
            />
          </InfoGrid>
        </ProfileCard>

        {/* Contact Information */}
        <ProfileCard
          title="Contact Information"
          description="How to reach you"
          icon={<Phone className="h-5 w-5" />}
        >
          <InfoGrid columns={1}>
            <InfoField
              label="Email Address"
              value={
                <a
                  href={`mailto:${user.email}`}
                  className="text-primary hover:underline"
                >
                  {formatEmail(user.email)}
                </a>
              }
              icon={<Mail className="h-4 w-4" />}
            />
            <InfoField
              label="Phone Number"
              value={
                user.phone === 'Not Specified' ? undefined : (
                  <a
                    href={`tel:${user.phone}`}
                    className="text-primary hover:underline"
                  >
                    {formatPhoneNumber(user.phone)}
                  </a>
                )
              }
              icon={<Phone className="h-4 w-4" />}
            />
            <InfoField
              label="Emergency Contact"
              value={user.emergencyContact}
              icon={<AlertCircle className="h-4 w-4" />}
            />
          </InfoGrid>
        </ProfileCard>

        {/* Professional Information */}
        {hasProfessionalInfo(user) && (
          <ProfileCard
            title="Professional Information"
            description="Your career and qualifications"
            icon={<Briefcase className="h-5 w-5" />}
            className="lg:col-span-2"
          >
            <InfoGrid columns={3}>
              <InfoField
                label="Role"
                value={getRoleDisplayName(user.roles?.[0] || '')}
                icon={<Briefcase className="h-4 w-4" />}
              />
              <InfoField
                label="Qualification"
                value={user.qualification}
                icon={<GraduationCap className="h-4 w-4" />}
              />
              <InfoField
                label="Experience"
                value={formatExperience(user.experience)}
                icon={<Clock className="h-4 w-4" />}
              />
            </InfoGrid>

            {user.cv?.file && (
              <div className="mt-6">
                <a
                  href={user.cv.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-primary bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors"
                >
                  <FileText className="h-5 w-5" />
                  <span>View CV/Resume</span>
                </a>
              </div>
            )}
          </ProfileCard>
        )}

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <ProfileCard
            title="Skills & Expertise"
            description="Your professional competencies"
            icon={<Award className="h-5 w-5" />}
            className={hasProfessionalInfo(user) ? '' : 'lg:col-span-2'}
          >
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1 text-sm font-medium"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </ProfileCard>
        )}

        {/* Access & Groups */}
        <ProfileCard
          title="Access & Groups"
          description="Your roles and group memberships"
          icon={<Users className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">
                Primary Role
              </p>
              <Badge variant="default">
                {getRoleDisplayName(user.roles?.[0] || '')}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">
                Groups
              </p>
              <UserGroupList showIcons size="sm" />
            </div>
          </div>
        </ProfileCard>

        {/* Account Information */}
        <ProfileCard
          title="Account Information"
          description="System and account details"
          variant="minimal"
        >
          <DataList
            items={[
              {
                label: 'User ID',
                value: user.id || 'N/A',
              },
              {
                label: 'Account Created',
                value: formatDateShort(user.createdAt),
                icon: <Calendar className="h-4 w-4" />,
              },
              {
                label: 'Last Updated',
                value: formatDateShort(user.updatedAt),
                icon: <Clock className="h-4 w-4" />,
              },
            ]}
          />
        </ProfileCard>
      </div>
    </div>
  );
}
