/**
 * Profile & Settings Feature - API Service
 */

import { api, apiFormData, USE_MOCK_DATA } from "@/lib/api-client";
import { mockProfileApi } from "./mock";
import type {
    CategoryOptions,
    FileKind,
    Package,
    ProfileBooking,
    ProfileCategories,
    ProfileCoverage,
    ProfileOverview,
    ProfilePreview,
    SupplementaryFile,
    UploadFile,
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

const liveProfileApi = {
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
      profile: {
        id: profile.id,
        businessName: profile.businessName,
        tagline: profile.tagline ?? "",
        bio: profile.bio ?? "",
        coverImageUrl: profile.coverImageKey,
        startingPrice:
          profile.startingPriceAmount != null ? profile.startingPriceAmount / 100 : null,
        completenessPct: profile.completenessScore,
        completenessMissing: [],
      },
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

  // Not part of this pass: the real PATCH /vendor/profile accepts tagline/bio/
  // startingPriceAmount/coverImageKey/mainCategoryId but not businessName (immutable
  // post-signup), and there's no cover-image upload endpoint in the live spec at all
  // (only the coverImageKey *string field*, source unconfirmed). Rather than half-wire
  // these against a guessed shape, both stay on the mock store — same as before this
  // pass, just now inconsistent with the now-real `getOverview` read. See day-02.md.
  updateCore: mockProfileApi.updateCore,
  uploadCoverImage: mockProfileApi.uploadCoverImage,

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
    const formData = new FormData();
    formData.append("file", file as any);
    // Kind is documented on this attach flow as `vendor_portfolio` even though the
    // `/files` schema's own `kind` enum still only lists `chat_attachment` — trusting
    // the flow description over the (apparently stale) enum, per the live spec.
    formData.append("kind", "vendor_portfolio");
    const uploadRes = await apiFormData.post<unknown>("/files", formData);
    const stored = unwrapPayload<{ id: string }>(uploadRes.data);

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
