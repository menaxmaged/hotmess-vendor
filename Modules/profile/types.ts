/**
 * Profile & Settings Feature Types
 */

export interface ProfileCore {
  id: string;
  businessName: string;
  tagline: string;
  bio: string;
  coverImageUrl: string | null;
  startingPrice: number | null;
  completenessPct: number;
  completenessMissing: string[];
}

export interface ProfileCategories {
  mainCategoryId: string | null;
  categoryIds: string[];
}

/** New concept, not in the old mock — cities/markets/occasion-types the studio serves. */
export interface ProfileCoverage {
  cityIds: string[];
  marketIds: string[];
  occasionTypeIds: string[];
}

export type AvailabilityBehaviour = "hide" | "show_busy" | "allow_request";

export type PaymentMethod = "cash" | "bank_transfer" | "card" | "instapay" | "wallet";

export interface ProfileBooking {
  depositPercent: number | null;
  paymentMethods: PaymentMethod[];
  maxBookingsPerDay: number | null;
  maxBookingsPerWeekend: number | null;
  minNoticeDays: number | null;
  availabilityBehaviour: AvailabilityBehaviour | null;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  soldCount: number;
}

export type FileKind = "lookbook" | "deck" | "other";

export interface SupplementaryFile {
  id: string;
  label: string;
  kind: FileKind;
  mimeType: string;
  byteSize: number;
}

export interface ProfileFiles {
  packages: Package[];
  files: SupplementaryFile[];
}

export interface VendorCategoryOption {
  id: string;
  nameEn: string;
  children: { id: string; nameEn: string }[];
}

export interface CoverageCityOption {
  id: string;
  nameEn: string;
  marketId: string;
}

export interface CoverageOccasionOption {
  id: string;
  nameEn: string;
}

export interface CategoryOptions {
  categories: VendorCategoryOption[];
  cities: CoverageCityOption[];
  occasions: CoverageOccasionOption[];
}

export interface ProfileOverview {
  profile: ProfileCore;
  categories: ProfileCategories;
  coverage: ProfileCoverage;
  booking: ProfileBooking;
  files: ProfileFiles;
}

export interface ProfilePreview {
  id: string;
  businessName: string;
  tagline: string | null;
  completenessScore: number;
  instagramConnected: boolean;
  isVisibleToBrides: boolean;
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
