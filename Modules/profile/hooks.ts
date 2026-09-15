/**
 * Profile & Settings Feature - Hooks
 */

import { getErrorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "./api";
import type {
    ProfileBooking,
    ProfileCategories,
    ProfileCoverage,
    UpdateProfileCoreInput,
    UploadFile,
    UploadImage,
    UpsertPackageInput,
} from "./types";

export const profileKeys = {
  all: ["profile"] as const,
  overview: () => [...profileKeys.all, "overview"] as const,
  core: () => [...profileKeys.all, "core"] as const,
  categoryOptions: () => [...profileKeys.all, "category-options"] as const,
  preview: () => [...profileKeys.all, "preview"] as const,
};

export const useProfileOverview = () => {
  return useQuery({
    queryKey: profileKeys.overview(),
    queryFn: profileApi.getOverview,
  });
};

/**
 * The studio's listing status. Anything but `active` means brides can't see the
 * profile (and for `suspended`, every thread is read-only) — screens explain it.
 */
export const useStudioStatus = () => {
  const { data } = useQuery({
    queryKey: profileKeys.core(),
    queryFn: profileApi.getCore,
    staleTime: 1000 * 60 * 5,
  });
  return data?.status ?? "active";
};

export const useCategoryOptions = () => {
  return useQuery({
    queryKey: profileKeys.categoryOptions(),
    queryFn: profileApi.getCategoryOptions,
    staleTime: 1000 * 60 * 30,
  });
};

// "Exactly what brides see" — same projection as GET /vendors/{id}.
export const useProfilePreview = (enabled = true) => {
  return useQuery({
    queryKey: profileKeys.preview(),
    queryFn: profileApi.getPreview,
    enabled,
  });
};

const useInvalidateProfile = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: profileKeys.overview() });
};

export const useUpdateProfileCore = () => {
  const invalidate = useInvalidateProfile();
  return useMutation({
    mutationFn: (input: UpdateProfileCoreInput) => profileApi.updateCore(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Update profile error:", getErrorMessage(error)),
  });
};

export const useUploadCoverImage = () => {
  const invalidate = useInvalidateProfile();
  return useMutation({
    mutationFn: (image: UploadImage) => profileApi.uploadCoverImage(image),
    onSuccess: invalidate,
    onError: (error) => console.error("Upload cover image error:", getErrorMessage(error)),
  });
};

export const useUpdateCategories = () => {
  const invalidate = useInvalidateProfile();
  return useMutation({
    mutationFn: (input: ProfileCategories) => profileApi.updateCategories(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Update categories error:", getErrorMessage(error)),
  });
};

export const useUpdateCoverage = () => {
  const invalidate = useInvalidateProfile();
  return useMutation({
    mutationFn: (input: ProfileCoverage) => profileApi.updateCoverage(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Update coverage error:", getErrorMessage(error)),
  });
};

export const useUpdateBooking = () => {
  const invalidate = useInvalidateProfile();
  return useMutation({
    mutationFn: (input: ProfileBooking) => profileApi.updateBooking(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Update booking error:", getErrorMessage(error)),
  });
};

export const useUpsertPackage = () => {
  const invalidate = useInvalidateProfile();
  return useMutation({
    mutationFn: (input: UpsertPackageInput) => profileApi.upsertPackage(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Save package error:", getErrorMessage(error)),
  });
};

export const useDeletePackage = () => {
  const invalidate = useInvalidateProfile();
  return useMutation({
    mutationFn: (packageId: string) => profileApi.deletePackage(packageId),
    onSuccess: invalidate,
    onError: (error) => console.error("Delete package error:", getErrorMessage(error)),
  });
};

export const useUploadFile = () => {
  const invalidate = useInvalidateProfile();
  return useMutation({
    mutationFn: (file: UploadFile) => profileApi.uploadFile(file),
    onSuccess: invalidate,
    onError: (error) => console.error("Upload file error:", getErrorMessage(error)),
  });
};

export const useDeleteFile = () => {
  const invalidate = useInvalidateProfile();
  return useMutation({
    mutationFn: (fileId: string) => profileApi.deleteFile(fileId),
    onSuccess: invalidate,
    onError: (error) => console.error("Delete file error:", getErrorMessage(error)),
  });
};
