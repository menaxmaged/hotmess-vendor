/**
 * Files Feature - Hooks
 */

import { useQuery } from "@tanstack/react-query";
import { filesApi } from "./api";

export const filesKeys = {
  all: ["files"] as const,
  usage: () => [...filesKeys.all, "usage"] as const,
};

export const useStorageUsage = () => {
  return useQuery({
    queryKey: filesKeys.usage(),
    queryFn: filesApi.getUsage,
  });
};
