/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Profile & Settings Feature - API Service
 */

import { api, apiFormData } from "@/lib/api-client";
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

export const profileApi = {
  getOverview: async (): Promise<ProfileOverview> => {
    const response = await api.get<unknown>("/vendor/profile/overview");
    return unwrapPayload<ProfileOverview>(response.data);
  },

  getCategoryOptions: async (): Promise<CategoryOptions> => {
    const response = await api.get<unknown>("/vendor/profile/category-options");
    return unwrapPayload<CategoryOptions>(response.data);
  },

  updateCore: async (input: UpdateProfileCoreInput): Promise<ProfileCore> => {
    const response = await api.patch<unknown>("/vendor/profile/core", input);
    return unwrapPayload<ProfileCore>(response.data);
  },

  uploadCoverImage: async (image: UploadImage): Promise<ProfileCore> => {
    const formData = new FormData();
    formData.append("coverImage", image as any);
    const response = await apiFormData.put<unknown>(
      "/vendor/profile/cover-image",
      formData,
    );
    return unwrapPayload<ProfileCore>(response.data);
  },

  updateCategories: async (
    input: ProfileCategories,
  ): Promise<ProfileCategories> => {
    const response = await api.patch<unknown>("/vendor/profile/categories", input);
    return unwrapPayload<ProfileCategories>(response.data);
  },

  updateBooking: async (input: ProfileBooking): Promise<ProfileBooking> => {
    const response = await api.patch<unknown>("/vendor/profile/booking", input);
    return unwrapPayload<ProfileBooking>(response.data);
  },

  connectInstagram: async (): Promise<InstagramStatus> => {
    const response = await api.post<unknown>("/vendor/profile/instagram/connect");
    return unwrapPayload<InstagramStatus>(response.data);
  },

  disconnectInstagram: async (): Promise<InstagramStatus> => {
    const response = await api.post<unknown>("/vendor/profile/instagram/disconnect");
    return unwrapPayload<InstagramStatus>(response.data);
  },

  upsertPackage: async (input: UpsertPackageInput): Promise<Package> => {
    const response = input.id
      ? await api.patch<unknown>(`/vendor/profile/packages/${input.id}`, input)
      : await api.post<unknown>("/vendor/profile/packages", input);
    return unwrapPayload<Package>(response.data);
  },

  deletePackage: async (packageId: string): Promise<void> => {
    await api.delete(`/vendor/profile/packages/${packageId}`);
  },

  uploadFile: async (file: UploadFile): Promise<SupplementaryFile> => {
    const formData = new FormData();
    formData.append("file", file as any);
    const response = await apiFormData.post<unknown>(
      "/vendor/profile/files",
      formData,
    );
    return unwrapPayload<SupplementaryFile>(response.data);
  },

  deleteFile: async (fileId: string): Promise<void> => {
    await api.delete(`/vendor/profile/files/${fileId}`);
  },
};
