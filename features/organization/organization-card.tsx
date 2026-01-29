'use client';

import { Organization } from '@/types/organization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building,
  Mail,
  Phone,
  Globe,
  Users,
  Calendar,
  MapPin,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { useOrganization } from '@/components/providers/organization-provider';

interface OrganizationCardProps {
  organization: Organization;
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  const employeeCount = organization.employees?.length || 0;
  const projectCount = organization.projects?.length || 0;
  const { selectedOrganization, setSelectedOrganization } = useOrganization();
  const isDefault = selectedOrganization?.id === organization.id;

  return (
    <Card className="group hover:border-primary/50 h-full transition-all duration-200 hover:shadow-lg">
      <Link
        href={`/users/dashboard/organizations/${organization.id}`}
        className="block"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {organization.logo ? (
                <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <Image
                    src={organization.logo.file}
                    alt={organization.organizationName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-600">
                  <Building className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <CardTitle className="group-hover:text-primary text-lg transition-colors">
                  {organization.organizationName}
                </CardTitle>
                <Badge
                  variant={organization.isActive ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {organization.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Address */}
          <div className="flex items-start space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="line-clamp-2">
              {organization.organizationAddress}
            </span>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{organization.organizationEmail}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{organization.organizationPhone}</span>
            </div>
            {organization.organizationWebsite && (
              <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Globe className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {organization.organizationWebsite}
                </span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <div className="flex items-center space-x-2 text-sm">
              <Users className="h-4 w-4 text-zinc-500" />
              <span className="text-zinc-600 dark:text-zinc-400">
                {employeeCount} {employeeCount === 1 ? 'Employee' : 'Employees'}
              </span>
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {projectCount} {projectCount === 1 ? 'Project' : 'Projects'}
            </div>
          </div>

          {/* Created Date */}
          {organization.createdAt && (
            <div className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-500">
              <Calendar className="h-3 w-3" />
              <span>
                Created {format(organization.createdAt, 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Set as Default Button */}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={(e) => {
              e.preventDefault();
              if (!isDefault) {
                setSelectedOrganization(organization);
              }
            }}
            disabled={isDefault}
          >
            <Star
              className={`mr-2 h-4 w-4 ${isDefault ? 'fill-yellow-500 text-yellow-500' : ''}`}
            />
            {isDefault ? 'Default Organization' : 'Set as Default'}
          </Button>
        </CardContent>
      </Link>
    </Card>
  );
}
