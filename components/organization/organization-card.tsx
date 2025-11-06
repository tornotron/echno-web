'use client';

import { Organization } from '@/types/organization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Mail, Phone, Globe, Users, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

interface OrganizationCardProps {
  organization: Organization;
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  const employeeCount = organization.employees?.length || 0;
  const projectCount = organization.projects?.length || 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50 h-full">
      <Link href={`/dashboard/organizations/${organization.id}`} className="block">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {organization.organizationLogo ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                  <Image
                    src={organization.organizationLogo}
                    alt={organization.organizationName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {organization.organizationName}
                </CardTitle>
                <Badge variant={organization.isActive ? 'default' : 'secondary'} className="mt-1">
                  {organization.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Address */}
          <div className="flex items-start space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{organization.organizationAddress}</span>
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
                <span className="truncate">{organization.organizationWebsite}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
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
              <span>Created {format(organization.createdAt, 'MMM d, yyyy')}</span>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
