/**
 * Onboarding Checklist Feature Types
 */

export interface ChecklistItem {
  id: string;
  labelEn: string;
  labelAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  /** In-app route to complete this item, e.g. "/profile". `null` if there's nowhere to send the vendor. */
  deepLink: string | null;
  isRequired: boolean;
  /** `null` means not done yet. Completing twice keeps the first timestamp (idempotent server-side). */
  completedAt: string | null;
}
