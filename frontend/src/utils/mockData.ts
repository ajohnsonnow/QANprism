/**
 * Mock Data - Sample LGBTQ+ Organizations
 * For development/demo until backend is ready
 */

import { Organization } from '../types';

// Portland, OR area sample organizations
export const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: '1',
    name: 'Q Center',
    description: 'Portland\'s LGBTQ+ community center offering support groups, social events, and resources',
    org_type: 'community',
    latitude: 45.5231,
    longitude: -122.6765,
    address: '4115 N Mississippi Ave, Portland, OR 97217',
    phone: '(503) 234-7837',
    website: 'https://www.pdxqcenter.org',
    hours: 'Mon-Fri 9am-9pm, Sat-Sun 10am-6pm',
    tags: ['community', 'support groups', 'youth services'],
    is_safe_space: true,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Outside In',
    description: 'Healthcare, housing, and social services for homeless and at-risk LGBTQ+ youth',
    org_type: 'healthcare',
    latitude: 45.5244,
    longitude: -122.6699,
    address: '1132 SW 13th Ave, Portland, OR 97205',
    phone: '(503) 223-4121',
    website: 'https://www.outsidein.org',
    hours: 'Mon-Fri 8am-8pm',
    tags: ['healthcare', 'housing', 'youth', 'mental health'],
    is_safe_space: true,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Cascade AIDS Project',
    description: 'HIV/AIDS prevention, testing, and support services for the LGBTQ+ community',
    org_type: 'healthcare',
    latitude: 45.5195,
    longitude: -122.6820,
    address: '620 SW 5th Ave #300, Portland, OR 97204',
    phone: '(503) 223-5907',
    website: 'https://www.cascadeaids.org',
    hours: 'Mon-Fri 9am-5pm',
    tags: ['healthcare', 'HIV testing', 'support'],
    is_safe_space: true,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'TransActive Gender Center',
    description: 'Support, education, and advocacy for transgender and gender diverse youth and families',
    org_type: 'nonprofit',
    latitude: 45.5289,
    longitude: -122.6359,
    address: '1631 NE Broadway #300, Portland, OR 97232',
    phone: '(503) 252-3000',
    website: 'https://www.transactiveonline.org',
    hours: 'Mon-Thu 9am-5pm',
    tags: ['transgender', 'youth', 'families', 'advocacy'],
    is_safe_space: true,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    name: 'Pride Counseling',
    description: 'LGBTQ+-affirming mental health counseling and therapy services',
    org_type: 'healthcare',
    latitude: 45.5152,
    longitude: -122.6514,
    address: '3534 SE Hawthorne Blvd, Portland, OR 97214',
    phone: '(503) 555-0199',
    hours: 'By appointment',
    tags: ['mental health', 'therapy', 'counseling'],
    is_safe_space: true,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    name: 'Equi Institute',
    description: 'Legal services and advocacy for LGBTQ+ individuals',
    org_type: 'legal',
    latitude: 45.5122,
    longitude: -122.6587,
    address: '621 SW Morrison St #1300, Portland, OR 97205',
    phone: '(503) 555-0156',
    website: 'https://www.equi.org',
    hours: 'Mon-Fri 9am-5pm',
    tags: ['legal', 'advocacy', 'name change', 'discrimination'],
    is_safe_space: true,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '7',
    name: 'Stumptown Coffee - Queer Owned',
    description: 'Queer-owned coffee shop and safe space for community gathering',
    org_type: 'business_food',
    latitude: 45.5234,
    longitude: -122.6762,
    address: '4033 SE Division St, Portland, OR 97202',
    hours: 'Daily 7am-7pm',
    tags: ['coffee', 'queer-owned', 'safe space'],
    is_safe_space: true,
    is_verified: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '8',
    name: 'Rainbow Housing',
    description: 'LGBTQ+-friendly affordable housing assistance',
    org_type: 'housing',
    latitude: 45.5331,
    longitude: -122.6710,
    address: '123 NW Couch St, Portland, OR 97209',
    phone: '(503) 555-0145',
    hours: 'Mon-Fri 10am-4pm',
    tags: ['housing', 'affordable', 'emergency shelter'],
    is_safe_space: true,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// For development: Add more cities as needed
export const getMockOrganizationsNearby = (
  latitude: number,
  longitude: number
): Organization[] => {
  // Simple mock: return all if within ~50km of Portland
  const portlandLat = 45.5152;
  const portlandLon = -122.6784;
  
  const distance = Math.sqrt(
    Math.pow(latitude - portlandLat, 2) + Math.pow(longitude - portlandLon, 2)
  ) * 111; // Rough km conversion

  if (distance < 50) {
    return MOCK_ORGANIZATIONS.map(org => ({
      ...org,
      distance: Math.abs(org.latitude - latitude) * 111000, // rough meters
    }));
  }

  return [];
};
