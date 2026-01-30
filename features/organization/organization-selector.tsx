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
import { useOrganizations } from '@/hooks/organization/use-organizations';

export function OrganizationSelector() {
  const { data: session } = useSession();
  const {
    defaultOrganization,
    setDefaultOrganization,
    organizations: contextOrganizations, // rename to avoid conflict
    setOrganizations,
  } = useOrganization();

  const { data: fetchedOrganizations } = useOrganizations();

  // Sync fetched organizations to context
  useEffect(() => {
    if (fetchedOrganizations) {
      setOrganizations(fetchedOrganizations);

      // Set first organization as default if none selected
      if (!defaultOrganization && fetchedOrganizations.length > 0) {
        setDefaultOrganization(fetchedOrganizations[0]);
      }
    }
  }, [
    fetchedOrganizations,
    setOrganizations,
    defaultOrganization,
    setDefaultOrganization,
  ]);

  if (!session || contextOrganizations.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Building className="h-4 w-4 text-zinc-500" />
      <Select
        value={defaultOrganization?.id?.toString() || ''}
        onValueChange={(value) => {
          const org = contextOrganizations.find(
            (o) => o.id?.toString() === value
          );
          if (org) {
            setDefaultOrganization(org);
          }
        }}
      >
        <SelectTrigger className="h-9 w-[200px] border-zinc-300 dark:border-zinc-700">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {contextOrganizations.map((org) => (
            <SelectItem key={org.id} value={org.id?.toString() || ''}>
              {org.organizationName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
