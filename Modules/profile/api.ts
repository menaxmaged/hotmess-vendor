/**
 * Profile & Settings Feature - API Service
 */

import { api, USE_MOCK_DATA } from "@/lib/api-client";
import { filesApi, storageKeyUrl } from "@/Modules/files/api";
import { mockProfileApi } from "./mock";
import type {
    CategoryOptions,
    FileKind,
    Package,
    ProfileBooking,
    ProfileCore,
    ProfileCategories,
    ProfileCoverage,
    ProfileOverview,
    StudioStatus,
    ProfilePreview,
    SupplementaryFile,
    UpdateProfileCoreInput,
    UploadFile,
    UploadImage,
    UpsertPackageInput,
} from "./types";

const unwrapPayload = <T>(payload: unknown, key?: string): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const container = payload as Record<string, unknown>;
    if (key && container[key] !== undefined) {
      return container[key] as T;
    }

    const nested = container.data ?? container.item ?? container.result;
    if (nested !== undefined) {
      return nested as T;
    }

    return container as T;
  }

  return payload as T;
};

// --- Real payload shapes (GET /vendor/profile, GET .../packages, GET .../files) ---

interface RealProfile {
  id: string;
  businessName: string;
  tagline: string | null;
  bio: string | null;
  coverImageKey: string | null;
  startingPriceAmount: number | null;
  completenessScore: number;
  mainCategory: string | null;
  categories: unknown[];
  servedCityIds?: string[];
  servedMarketIds?: string[];
  occasionTypeIds?: string[];
  bookingRules: Record<string, unknown> | null;
  status?: StudioStatus;
}

interface RealPackage {
  id: string;
  name: string;
  priceAmount: number;
  soldCount?: number;
}

interface RealFile {
  id: string;
  label: string | null;
  kind: FileKind;
  storedFile?: { id: string; mimeType: string; byteSize: number };
}

const mapPackage = (pkg: RealPackage): Package => ({
  id: pkg.id,
  name: pkg.name,
  price: pkg.priceAmount / 100,
  soldCount: pkg.soldCount ?? 0,
});

const mapFile = (file: RealFile): SupplementaryFile => ({
  id: file.id,
  label: file.label ?? "",
  kind: file.kind,
  mimeType: file.storedFile?.mimeType ?? "",
  byteSize: file.storedFile?.byteSize ?? 0,
});

const mapCore = (profile: RealProfile): ProfileCore => ({
  id: profile.id,
  businessName: profile.businessName,
  tagline: profile.tagline ?? "",
  bio: profile.bio ?? "",
  coverImageUrl: storageKeyUrl(profile.coverImageKey),
  startingPrice: profile.startingPriceAmount != null ? profile.startingPriceAmount / 100 : null,
  completenessPct: profile.completenessScore,
  completenessMissing: [],
  // Missing on older payloads: treat as live rather than warn every vendor.
  status: profile.status ?? "active",
});

const fetchCore = async (): Promise<ProfileCore> => {
  const response = await api.get<unknown>("/vendor/profile");
  return mapCore(unwrapPayload<RealProfile>(response.data));
};

const liveProfileApi = {
  getCore: fetchCore,

  getOverview: async (): Promise<ProfileOverview> => {
    const [profileRes, packagesRes, filesRes] = await Promise.all([
      api.get<unknown>("/vendor/profile"),
      api.get<unknown>("/vendor/profile/packages"),
      api.get<unknown>("/vendor/profile/files"),
    ]);
    const profile = unwrapPayload<RealProfile>(profileRes.data);
    const packages = unwrapPayload<RealPackage[]>(packagesRes.data);
    const files = unwrapPayload<RealFile[]>(filesRes.data);

    const bookingRules = profile.bookingRules ?? {};

    return {
      profile: mapCore(profile),
      categories: {
        mainCategoryId: profile.mainCategory,
        // Example payload for `categories` is always `[]` in the live spec — shape unconfirmed,
        // so this accepts either bare id strings or `{ id }` objects.
        categoryIds: (profile.categories ?? []).map((c) =>
          typeof c === "string" ? c : ((c as { id: string }).id),
        ),
      },
      coverage: {
        cityIds: profile.servedCityIds ?? [],
        marketIds: profile.servedMarketIds ?? [],
        occasionTypeIds: profile.occasionTypeIds ?? [],
      },
      booking: {
        depositPercent: (bookingRules.depositPercent as number) ?? null,
        paymentMethods: (bookingRules.paymentMethods as ProfileBooking["paymentMethods"]) ?? [],
        maxBookingsPerDay: (bookingRules.maxBookingsPerDay as number) ?? null,
        maxBookingsPerWeekend: (bookingRules.maxBookingsPerWeekend as number) ?? null,
        minNoticeDays: (bookingRules.minNoticeDays as number) ?? null,
        availabilityBehaviour:
          (bookingRules.availabilityBehaviour as ProfileBooking["availabilityBehaviour"]) ?? null,
      },
      files: {
        packages: packages.map(mapPackage),
        files: files.map(mapFile),
      },
    };
  },

  getCategoryOptions: async (): Promise<CategoryOptions> => {
    const [categoriesRes, citiesRes, occasionsRes] = await Promise.all([
      api.get<unknown>("/cms/vendor-categories"),
      api.get<unknown>("/cms/cities"),
      api.get<unknown>("/cms/occasion-types"),
    ]);
    const categories = unwrapPayload<
      { id: string; nameEn: string; children?: { id: string; nameEn: string }[] }[]
    >(categoriesRes.data);
    const cities = unwrapPayload<{ id: string; nameEn: string; marketId: string }[]>(
      citiesRes.data,
    );
    const occasions = unwrapPayload<{ id: string; nameEn: string }[]>(occasionsRes.data);

    return {
      categories: categories.map((c) => ({
        id: c.id,
        nameEn: c.nameEn,
        children: c.children ?? [],
      })),
      cities: cities.map((c) => ({ id: c.id, nameEn: c.nameEn, marketId: c.marketId })),
      occasions: occasions.map((o) => ({ id: o.id, nameEn: o.nameEn })),
    };
  },

  // PATCH /vendor/profile: omitted = unchanged, null = cleared. `businessName`
  // is not editable server-side at all. bio is capped at 160 by the column.
  updateCore: async (input: UpdateProfileCoreInput): Promise<ProfileCore> => {
    await api.patch<unknown>("/vendor/profile", {
      ...(input.tagline !== undefined ? { tagline: input.tagline.trim() || null } : {}),
      ...(input.bio !== undefined ? { bio: input.bio.trim() || null } : {}),
      ...(input.startingPrice !== undefined
        ? {
            startingPriceAmount:
              input.startingPrice == null ? null : Math.round(input.startingPrice * 100),
          }
        : {}),
    });
    return fetchCore();
  },

  // Studio media uploads as `vendor_portfolio` (not swept); the profile stores
  // the returned storageKey, served back from /uploads/<key>.
  uploadCoverImage: async (image: UploadImage): Promise<ProfileCore> => {
    const stored = await filesApi.upload(image, "vendor_portfolio");
    await api.patch<unknown>("/vendor/profile", { coverImageKey: stored.storageKey });
    return fetchCore();
  },

  updateCategories: async (input: ProfileCategories): Promise<ProfileCategories> => {
    await api.put<unknown>("/vendor/profile/categories", {
      categoryIds: input.categoryIds,
      mainCategoryId: input.mainCategoryId,
    });
    return input;
  },

  updateCoverage: async (input: ProfileCoverage): Promise<ProfileCoverage> => {
    await api.put<unknown>("/vendor/profile/coverage", input);
    return input;
  },

  updateBooking: async (input: ProfileBooking): Promise<ProfileBooking> => {
    await api.put<unknown>("/vendor/profile/booking-rules", {
      depositPercent: input.depositPercent,
      paymentMethods: input.paymentMethods,
      maxBookingsPerDay: input.maxBookingsPerDay,
      maxBookingsPerWeekend: input.maxBookingsPerWeekend,
      minNoticeDays: input.minNoticeDays,
      availabilityBehaviour: input.availabilityBehaviour,
    });
    return input;
  },

  upsertPackage: async (input: UpsertPackageInput): Promise<Package> => {
    const priceAmount = Math.round(input.price * 100);
    const response = input.id
      ? await api.patch<unknown>(`/vendor/profile/packages/${input.id}`, {
          name: input.name,
          priceAmount,
        })
      : await api.post<unknown>("/vendor/profile/packages", {
          name: input.name,
          priceAmount,
        });
    const pkg = unwrapPayload<Partial<RealPackage>>(response.data);
    return {
      id: pkg.id ?? input.id ?? "",
      name: pkg.name ?? input.name,
      price: pkg.priceAmount != null ? pkg.priceAmount / 100 : input.price,
      soldCount: pkg.soldCount ?? 0,
    };
  },

  deletePackage: async (packageId: string): Promise<void> => {
    await api.delete(`/vendor/profile/packages/${packageId}`);
  },

  uploadFile: async (file: UploadFile): Promise<SupplementaryFile> => {
    const stored = await filesApi.upload(file, "vendor_portfolio");

    const attachRes = await api.post<unknown>("/vendor/profile/files", {
      fileId: stored.id,
      label: file.name,
    });
    return mapFile(unwrapPayload<RealFile>(attachRes.data));
  },

  deleteFile: async (fileId: string): Promise<void> => {
    await api.delete(`/vendor/profile/files/${fileId}`);
  },

  getPreview: async (): Promise<ProfilePreview> => {
    const response = await api.get<unknown>("/vendor/profile/preview");
    return unwrapPayload<ProfilePreview>(response.data);
  },
};

export const profileApi: typeof liveProfileApi = USE_MOCK_DATA
  ? mockProfileApi
  : liveProfileApi;
