import { Organization } from '@/types/organization';

export const mockOrganizations: Organization[] = [
  {
    id: 1,
    organizationName: 'Echno Construction Ltd.',
    organizationAddress:
      'Plot No. 45, Andheri East, Mumbai, Maharashtra 400069',
    organizationEmail: 'contact@echnoai.com',
    organizationPhone: '+91 22 4567 8900',
    organizationWebsite: 'https://echno.com',
    organizationLogo:
      'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=400&fit=crop',
    creatorId: 1,
    createdAt: new Date('2020-01-10'),
    isActive: true,
    type: 'internal',
  },
  {
    id: 2,
    organizationName: 'BuildRight Infrastructure Pvt. Ltd.',
    organizationAddress: 'Sector 62, Noida, Uttar Pradesh 201301',
    organizationEmail: 'info@buildright.com',
    organizationPhone: '+91 120 456 7890',
    organizationWebsite: 'https://buildright.com',
    organizationLogo:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop',
    creatorId: 1,
    createdAt: new Date('2019-06-15'),
    isActive: true,
    type: 'client',
  },
  {
    id: 3,
    organizationName: 'GreenBuild Constructions',
    organizationAddress: 'Whitefield, Bangalore, Karnataka 560066',
    organizationEmail: 'hello@greenbuild.in',
    organizationPhone: '+91 80 2345 6789',
    organizationWebsite: 'https://greenbuild.in',
    organizationLogo:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop',
    creatorId: 4,
    createdAt: new Date('2021-03-20'),
    isActive: true,
    type: 'client',
  },
];
