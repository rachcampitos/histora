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
  try {
    const response = await fetch(`${API_BASE_URL}/nurses/featured?limit=${limit}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error('Failed to fetch featured professionals:', response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching featured professionals:', error);
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
