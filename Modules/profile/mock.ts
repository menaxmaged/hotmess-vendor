/**
 * Profile & Settings Feature - Mock Data
 */

import { mockDelay, mockId } from "@/lib/mock-utils";
import type {
    CategoryOptions,
    Package,
    ProfileBooking,
    ProfileCategories,
    ProfileCore,
    ProfileCoverage,
    ProfileOverview,
    ProfilePreview,
    SupplementaryFile,
    UpdateProfileCoreInput,
    UploadFile,
    UploadImage,
    UpsertPackageInput,
} from "./types";

const MAIN_CATEGORY_ID = "cat-couture";
const SUB_BRIDAL_ID = "cat-couture-bridal";
const CITY_CAIRO_ID = "city-cairo";
const CITY_ALEX_ID = "city-alexandria";
const MARKET_EG_ID = "market-eg";
const OCCASION_WEDDING_ID = "occ-wedding";
const OCCASION_ENGAGEMENT_ID = "occ-engagement";

const core: ProfileCore = {
  id: "mock-vendor-id",
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
  status: "active",
};

const categories: ProfileCategories = {
  mainCategoryId: MAIN_CATEGORY_ID,
  categoryIds: [MAIN_CATEGORY_ID, SUB_BRIDAL_ID],
};

const coverage: ProfileCoverage = {
  cityIds: [CITY_CAIRO_ID, CITY_ALEX_ID],
  marketIds: [MARKET_EG_ID],
  occasionTypeIds: [OCCASION_WEDDING_ID, OCCASION_ENGAGEMENT_ID],
};

const booking: ProfileBooking = {
  depositPercent: 25,
  paymentMethods: ["cash", "instapay", "card"],
  maxBookingsPerDay: 2,
  maxBookingsPerWeekend: 4,
  minNoticeDays: 14,
  availabilityBehaviour: "hide",
};

const packages: Package[] = [
  { id: "pkg-1", name: "Classic Bridal", price: 45000, soldCount: 12 },
  { id: "pkg-2", name: "Premium Bridal", price: 75000, soldCount: 5 },
];

const files: SupplementaryFile[] = [
  {
    id: "file-1",
    label: "Lookbook_2026",
    kind: "lookbook",
    mimeType: "application/pdf",
    byteSize: 2_400_000,
  },
];

const categoryOptions: CategoryOptions = {
  categories: [
    {
      id: MAIN_CATEGORY_ID,
      nameEn: "Couture & Dressmakers",
      children: [
        { id: SUB_BRIDAL_ID, nameEn: "Bridal gowns" },
        { id: "cat-couture-evening", nameEn: "Evening wear" },
        { id: "cat-couture-alterations", nameEn: "Alterations" },
      ],
    },
    {
      id: "cat-photography",
      nameEn: "Photography",
      children: [
        { id: "cat-photography-wedding", nameEn: "Wedding photography" },
        { id: "cat-photography-engagement", nameEn: "Engagement shoots" },
      ],
    },
    {
      id: "cat-catering",
      nameEn: "Catering",
      children: [{ id: "cat-catering-full", nameEn: "Full-service catering" }],
    },
    { id: "cat-florists", nameEn: "Florists", children: [] },
    { id: "cat-venues", nameEn: "Venues", children: [] },
  ],
  cities: [
    { id: CITY_CAIRO_ID, nameEn: "Cairo", marketId: MARKET_EG_ID },
    { id: CITY_ALEX_ID, nameEn: "Alexandria", marketId: MARKET_EG_ID },
    { id: "city-hurghada", nameEn: "Hurghada", marketId: MARKET_EG_ID },
  ],
  occasions: [
    { id: OCCASION_WEDDING_ID, nameEn: "Wedding" },
    { id: OCCASION_ENGAGEMENT_ID, nameEn: "Engagement" },
    { id: "occ-henna", nameEn: "Henna night" },
  ],
};

export const mockProfileApi = {
  getCore: async (): Promise<ProfileCore> => {
    await mockDelay(150);
    return { ...core };
  },

  getOverview: async (): Promise<ProfileOverview> => {
    await mockDelay();
    return {
      profile: { ...core },
      categories: { ...categories },
      coverage: { ...coverage },
      booking: { ...booking },
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

  updateCoverage: async (input: ProfileCoverage): Promise<ProfileCoverage> => {
    await mockDelay(250);
    Object.assign(coverage, input);
    return { ...coverage };
  },

  updateBooking: async (input: ProfileBooking): Promise<ProfileBooking> => {
    await mockDelay(250);
    Object.assign(booking, input);
    return { ...booking };
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
      label: file.name,
      kind: "other",
      mimeType: file.type,
      byteSize: 0,
    };
    files.push(created);
    return created;
  },

  deleteFile: async (fileId: string): Promise<void> => {
    await mockDelay(200);
    const index = files.findIndex((f) => f.id === fileId);
    if (index !== -1) files.splice(index, 1);
  },

  getPreview: async (): Promise<ProfilePreview> => {
    await mockDelay(200);
    return {
      id: "mock-vendor-id",
      businessName: core.businessName,
      tagline: core.tagline,
      completenessScore: core.completenessPct,
      // Instagram state moved to Modules/instagram — this preview field has no
      // live UI consumer yet (see day-02.md), so it's not worth wiring cross-module.
      instagramConnected: true,
      isVisibleToBrides: true,
    };
  },
};
