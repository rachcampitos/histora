export interface Education {
  degree: string;
  institution: string;
  year: number;
}

export interface Doctor {
  _id: string;
  clinicId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  specialty: string;
  subspecialties?: string[];
  licenseNumber?: string;
  bio?: string;
  education?: Education[];
  isPublicProfile: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}
