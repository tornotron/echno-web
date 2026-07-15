import { Organization } from '@tornotron/echno-core/organization/types';

export const mockOrganizations: Organization[] = [
  /**
   * @deprecated Use `useOrganizations` hook or `organizationService` instead.
   */
  {
    id: 1,
    organizationName: 'Echno Construction Ltd.',
    organizationAddress:
      'Plot No. 45, Andheri East, Mumbai, Maharashtra 400069',
    organizationEmail: 'contact@echno.com',
    organizationPhone: '+91 22 4567 8900',
    organizationWebsite: 'https://echno.com',
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
    creatorId: 4,
    createdAt: new Date('2021-03-20'),
    isActive: true,
  },
];
