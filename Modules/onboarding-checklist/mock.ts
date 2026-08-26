/**
 * Onboarding Checklist Feature - Mock Data
 */

import { mockDelay } from "@/lib/mock-utils";
import type { ChecklistItem } from "./types";

const items: ChecklistItem[] = [
  {
    id: "item-profile",
    labelEn: "Complete your profile",
    labelAr: "أكملي ملفك",
    descriptionEn: "Add your tagline, bio and cover image.",
    descriptionAr: null,
    deepLink: "/more/profile",
    isRequired: true,
    completedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "item-packages",
    labelEn: "Add a package",
    labelAr: "",
    descriptionEn: "Show brides what you offer and at what price.",
    descriptionAr: null,
    deepLink: "/more/profile",
    isRequired: true,
    completedAt: null,
  },
  {
    id: "item-instagram",
    labelEn: "Connect Instagram",
    labelAr: "",
    descriptionEn: "Pull your portfolio in automatically.",
    descriptionAr: null,
    deepLink: "/more/profile",
    isRequired: false,
    completedAt: null,
  },
  {
    id: "item-team",
    labelEn: "Invite your team",
    labelAr: "",
    descriptionEn: "Bring in the people who'll help you respond to leads.",
    descriptionAr: null,
    deepLink: "/more/team",
    isRequired: false,
    completedAt: null,
  },
];

export const mockOnboardingChecklistApi = {
  getChecklist: async (): Promise<ChecklistItem[]> => {
    await mockDelay();
    return items.map((i) => ({ ...i }));
  },

  completeItem: async (itemId: string): Promise<ChecklistItem> => {
    await mockDelay(200);
    const item = items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Mock checklist item not found: ${itemId}`);
    if (!item.completedAt) item.completedAt = new Date().toISOString();
    return { ...item };
  },
};
