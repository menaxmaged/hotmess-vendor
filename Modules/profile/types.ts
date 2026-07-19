/**
 * Profile & Settings Feature Types
 */

export interface ProfileCore {
  businessName: string;
  tagline: string;
  bio: string;
  coverImageUrl: string | null;
  startingPrice: number | null;
  completenessPct: number;
  completenessMissing: string[];
}

export interface ProfileCategories {
  mainCategory: string | null;
  subcategories: string[];
  citiesServed: string[];
  occasionsCovered: string[];
}

export type AvailabilityBehaviour =
  | "hide_when_booked"
  | "show_as_unavailable"
  | "always_visible";

export interface ProfileBooking {
  startingPrice: number | null;
  depositPct: number | null;
  paymentMethods: string[];
  maxBookingsPerDay: number | null;
  maxBookingsPerWeekend: number | null;
  minNoticeDays: number | null;
  availabilityBehaviour: AvailabilityBehaviour;
}

export interface InstagramStatus {
  connected: boolean;
  username?: string | null;
  lastSyncAt?: string | null;
  portfolioImages: string[];
}

export interface Package {
  id: string;
  name: string;
  price: number;
  soldCount: number;
}

export interface SupplementaryFile {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface ProfileFiles {
  packages: Package[];
  files: SupplementaryFile[];
}

export interface CategoryOptions {
  mainCategories: string[];
  subcategoriesByMain: Record<string, string[]>;
  cities: string[];
  occasions: string[];
  paymentMethods: string[];
}

export interface ProfileOverview {
  profile: ProfileCore;
  categories: ProfileCategories;
  booking: ProfileBooking;
  instagram: InstagramStatus;
  files: ProfileFiles;
}

export interface UpdateProfileCoreInput {
  businessName?: string;
  tagline?: string;
  bio?: string;
  startingPrice?: number | null;
}

export interface UploadImage {
  uri: string;
  name: string;
  type: string;
}

export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export interface UpsertPackageInput {
  id?: string;
  name: string;
  price: number;
}
