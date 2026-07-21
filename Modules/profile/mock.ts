/**
 * Profile & Settings Feature - Mock Data
 */

import { mockDelay, mockId } from "@/lib/mock-utils";
import type {
    CategoryOptions,
    InstagramStatus,
    Package,
    ProfileBooking,
    ProfileCategories,
    ProfileCore,
    ProfileOverview,
    SupplementaryFile,
    UpdateProfileCoreInput,
    UploadFile,
    UploadImage,
    UpsertPackageInput,
} from "./types";

const core: ProfileCore = {
  businessName: "Atelier Amira",
  tagline: "Couture bridal, made in Cairo",
  bio: "We design and hand-finish bridal gowns for brides who want something no one else will wear. Every piece starts with a sketch and a conversation.",
  coverImageUrl: "https://picsum.photos/seed/atelier-cover/900/500",
  startingPrice: 45000,
  completenessPct: 72,
  completenessMissing: [
    "Add 3 portfolio images",
    "Connect Instagram",
    "Define your packages",
  ],
};

const categories: ProfileCategories = {
  mainCategory: "Couture & Dressmakers",
  subcategories: ["Bridal gowns"],
  citiesServed: ["Cairo", "Alexandria"],
  occasionsCovered: ["Wedding", "Engagement"],
};

const booking: ProfileBooking = {
  startingPrice: 45000,
  depositPct: 25,
  paymentMethods: ["Cash", "Instapay", "Card"],
  maxBookingsPerDay: 2,
  maxBookingsPerWeekend: 4,
  minNoticeDays: 14,
  availabilityBehaviour: "hide_when_booked",
};

const instagram: InstagramStatus = {
  connected: true,
  username: "atelier.amira",
  lastSyncAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  portfolioImages: [
    "https://picsum.photos/seed/portfolio-1/400/400",
    "https://picsum.photos/seed/portfolio-2/400/400",
    "https://picsum.photos/seed/portfolio-3/400/400",
    "https://picsum.photos/seed/portfolio-4/400/400",
    "https://picsum.photos/seed/portfolio-5/400/400",
    "https://picsum.photos/seed/portfolio-6/400/400",
  ],
};

const packages: Package[] = [
  { id: "pkg-1", name: "Classic Bridal", price: 45000, soldCount: 12 },
  { id: "pkg-2", name: "Premium Bridal", price: 75000, soldCount: 5 },
];

const files: SupplementaryFile[] = [
  {
    id: "file-1",
    name: "Lookbook_2026.pdf",
    url: "https://example.com/lookbook.pdf",
    uploadedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

const categoryOptions: CategoryOptions = {
  mainCategories: [
    "Couture & Dressmakers",
    "Photography",
    "Catering",
    "Florists",
    "Venues",
    "DJs & Music",
    "Beauty Artists",
  ],
  subcategoriesByMain: {
    "Couture & Dressmakers": ["Bridal gowns", "Evening wear", "Alterations"],
    Photography: ["Wedding photography", "Engagement shoots", "Videography"],
    Catering: ["Full-service catering", "Desserts", "Bar service"],
    Florists: ["Bouquets", "Venue florals", "Centerpieces"],
    Venues: ["Indoor", "Outdoor", "Destination"],
    "DJs & Music": ["DJ", "Live band", "MC"],
    "Beauty Artists": ["Makeup", "Hair", "Henna"],
  },
  cities: ["Cairo", "Giza", "Alexandria", "Hurghada", "Sharm El Sheikh"],
  occasions: ["Wedding", "Engagement", "Bridal shower", "Henna night"],
  paymentMethods: ["Cash", "Instapay", "Card", "Bank transfer"],
};

export const mockProfileApi = {
  getOverview: async (): Promise<ProfileOverview> => {
    await mockDelay();
    return {
      profile: { ...core },
      categories: { ...categories },
      booking: { ...booking },
      instagram: { ...instagram },
      files: { packages: [...packages], files: [...files] },
    };
  },

  getCategoryOptions: async (): Promise<CategoryOptions> => {
    await mockDelay(200);
    return categoryOptions;
  },

  updateCore: async (input: UpdateProfileCoreInput): Promise<ProfileCore> => {
    await mockDelay(250);
    Object.assign(core, input);
    return { ...core };
  },

  uploadCoverImage: async (image: UploadImage): Promise<ProfileCore> => {
    await mockDelay(400);
    core.coverImageUrl = image.uri;
    return { ...core };
  },

  updateCategories: async (input: ProfileCategories): Promise<ProfileCategories> => {
    await mockDelay(250);
    Object.assign(categories, input);
    return { ...categories };
  },

  updateBooking: async (input: ProfileBooking): Promise<ProfileBooking> => {
    await mockDelay(250);
    Object.assign(booking, input);
    return { ...booking };
  },

  connectInstagram: async (): Promise<InstagramStatus> => {
    await mockDelay(500);
    instagram.connected = true;
    instagram.username = "atelier.amira";
    instagram.lastSyncAt = new Date().toISOString();
    return { ...instagram };
  },

  disconnectInstagram: async (): Promise<InstagramStatus> => {
    await mockDelay(250);
    instagram.connected = false;
    instagram.username = null;
    instagram.lastSyncAt = null;
    return { ...instagram };
  },

  upsertPackage: async (input: UpsertPackageInput): Promise<Package> => {
    await mockDelay(250);
    if (input.id) {
      const existing = packages.find((p) => p.id === input.id);
      if (!existing) throw new Error(`Mock package not found: ${input.id}`);
      existing.name = input.name;
      existing.price = input.price;
      return { ...existing };
    }
    const created: Package = { id: mockId(), name: input.name, price: input.price, soldCount: 0 };
    packages.push(created);
    return created;
  },

  deletePackage: async (packageId: string): Promise<void> => {
    await mockDelay(200);
    const index = packages.findIndex((p) => p.id === packageId);
    if (index !== -1) packages.splice(index, 1);
  },

  uploadFile: async (file: UploadFile): Promise<SupplementaryFile> => {
    await mockDelay(400);
    const created: SupplementaryFile = {
      id: mockId(),
      name: file.name,
      url: file.uri,
      uploadedAt: new Date().toISOString(),
    };
    files.push(created);
    return created;
  },

  deleteFile: async (fileId: string): Promise<void> => {
    await mockDelay(200);
    const index = files.findIndex((f) => f.id === fileId);
    if (index !== -1) files.splice(index, 1);
  },
};
