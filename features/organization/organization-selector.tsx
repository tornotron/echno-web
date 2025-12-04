'use client';

import { useOrganization } from '@/components/providers/organization-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building } from 'lucide-react';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { mockOrganizations } from '@/components/shared/data/organizations';

export function OrganizationSelector() {
  const { data: session } = useSession();
  const {
    selectedOrganization,
    setSelectedOrganization,
    organizations,
    setOrganizations,
  } = useOrganization();

  // Mock: Load user's organizations (replace with actual API call)
  useEffect(() => {
    if (session?.user) {
      // TODO: Replace with actual API call to fetch user's organizations
      // TODO: Replace with actual API call to fetch user's organizations
      // const mockOrganizations = ... (removed local definition)

      setOrganizations(mockOrganizations);

      // Set first organization as default if none selected
      if (!selectedOrganization && mockOrganizations.length > 0) {
        setSelectedOrganization(mockOrganizations[0]);
      }
    }
  }, [
    session,
    selectedOrganization,
    setOrganizations,
    setSelectedOrganization,
  ]);

  if (!session || organizations.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Building className="h-4 w-4 text-zinc-500" />
      <Select
        value={selectedOrganization?.id?.toString() || ''}
        onValueChange={(value) => {
          const org = organizations.find((o) => o.id?.toString() === value);
          if (org) {
            setSelectedOrganization(org);
          }
        }}
      >
        <SelectTrigger className="h-9 w-[200px] border-zinc-300 dark:border-zinc-700">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id?.toString() || ''}>
              {org.organizationName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
