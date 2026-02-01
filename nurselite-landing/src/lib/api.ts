// API Configuration for NurseLite Landing

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.historahealth.com';

export interface FeaturedProfessional {
  id: string;
  firstName: string;
  rating: number;
  specialty: string;
  photoUrl: string | null;
  verified: boolean;
  totalReviews: number;
}

// Search Result Types
export interface NurseSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  rating: number;
  totalReviews: number;
  specialty: string;
  services: string[];
  distance: number;
  verified: boolean;
  available: boolean;
}

export interface SearchResponse {
  nurses: NurseSearchResult[];
  total: number;
  hasMore: boolean;
}

export interface SearchParams {
  lat: number;
  lng: number;
  radius?: number;
  category?: string;
  limit?: number;
}

export interface FeaturedResponse {
  professionals: FeaturedProfessional[];
  stats: {
    totalProfessionals: number;
    totalServices: number;
    averageRating: number;
  };
}

/**
 * Fetch featured professionals for the landing page
 */
export async function getFeaturedProfessionals(limit = 3): Promise<FeaturedResponse | null> {
  // In development without local API, use fallback data to avoid console errors
  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL) {
    return fallbackFeaturedData;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/nurses/featured?limit=${limit}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.warn('API unavailable, using fallback data');
      return null;
    }

    return response.json();
  } catch {
    // Silently fall back to default data
    return null;
  }
}

/**
 * Fallback data when API is unavailable
 */
export const fallbackFeaturedData: FeaturedResponse = {
  professionals: [
    {
      id: '1',
      firstName: 'Maria',
      rating: 4.9,
      specialty: 'Geriatria',
      photoUrl: null,
      verified: true,
      totalReviews: 45,
    },
    {
      id: '2',
      firstName: 'Ana',
      rating: 4.8,
      specialty: 'Curaciones',
      photoUrl: null,
      verified: true,
      totalReviews: 32,
    },
    {
      id: '3',
      firstName: 'Rosa',
      rating: 5.0,
      specialty: 'Inyecciones',
      photoUrl: null,
      verified: true,
      totalReviews: 28,
    },
  ],
  stats: {
    totalProfessionals: 500,
    totalServices: 2000,
    averageRating: 4.9,
  },
};

/**
 * Search for nurses by location and optional category
 */
export async function searchNurses(params: SearchParams): Promise<SearchResponse> {
  const { lat, lng, radius = 10, category, limit = 6 } = params;

  // Build query string
  const queryParams = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radius: radius.toString(),
    limit: limit.toString(),
  });

  if (category) {
    queryParams.append('category', category);
  }

  // In development without local API, use fallback data
  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL) {
    return fallbackSearchData;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/nurses/search?${queryParams}`, {
      cache: 'no-store', // Don't cache search results
    });

    if (!response.ok) {
      console.warn('Search API unavailable, using fallback data');
      return fallbackSearchData;
    }

    return response.json();
  } catch {
    // Silently fall back to default data
    return fallbackSearchData;
  }
}

/**
 * Fallback data for search when API is unavailable
 */
export const fallbackSearchData: SearchResponse = {
  nurses: [
    {
      id: '1',
      firstName: 'Maria Claudia',
      lastName: 'Chavez',
      rating: 4.9,
      totalReviews: 45,
      specialty: 'Geriatria',
      services: ['elderly_care', 'vital_signs', 'medication'],
      photoUrl: null,
      distance: 1.2,
      verified: true,
      available: true,
    },
    {
      id: '2',
      firstName: 'Ana Rosa',
      lastName: 'Lopez',
      rating: 4.8,
      totalReviews: 32,
      specialty: 'Curaciones',
      services: ['wound_care', 'injection', 'post_surgery'],
      photoUrl: null,
      distance: 2.5,
      verified: true,
      available: true,
    },
    {
      id: '3',
      firstName: 'Rosa Maria',
      lastName: 'Garcia',
      rating: 5.0,
      totalReviews: 28,
      specialty: 'Inyecciones',
      services: ['injection', 'vital_signs', 'nebulization'],
      photoUrl: null,
      distance: 3.1,
      verified: true,
      available: true,
    },
    {
      id: '4',
      firstName: 'Carmen Elena',
      lastName: 'Rodriguez',
      rating: 4.7,
      totalReviews: 51,
      specialty: 'Cuidado Post-operatorio',
      services: ['post_surgery', 'wound_care', 'medication'],
      photoUrl: null,
      distance: 3.8,
      verified: true,
      available: true,
    },
    {
      id: '5',
      firstName: 'Lucia',
      lastName: 'Fernandez',
      rating: 4.9,
      totalReviews: 67,
      specialty: 'Adulto Mayor',
      services: ['elderly_care', 'hospital_care', 'vital_signs'],
      photoUrl: null,
      distance: 4.2,
      verified: true,
      available: false,
    },
    {
      id: '6',
      firstName: 'Patricia',
      lastName: 'Mendoza',
      rating: 4.6,
      totalReviews: 23,
      specialty: 'Procedimientos Generales',
      services: ['vital_signs', 'nebulization', 'medication'],
      photoUrl: null,
      distance: 5.0,
      verified: true,
      available: true,
    },
  ],
  total: 23,
  hasMore: true,
};
