/**
 * Automation Feature Types
 */

export type LeadSource = "browse" | "explore" | "ad" | "task" | "direct";

export interface RuleCriteria {
  leadSource?: LeadSource[];
  occasionTypeIds?: string[];
  cityIds?: string[];
}

export interface AutoAssignRule {
  id: string;
  name: string;
  criteria: RuleCriteria;
  assignToMemberId: string | null;
  displayOrder: number;
  isActive: boolean;
  firedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRuleInput {
  name: string;
  criteria: RuleCriteria;
  assignToMemberId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateRuleInput {
  ruleId: string;
  name?: string;
  criteria?: RuleCriteria;
  assignToMemberId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export type WelcomeFlowMode =
  | "off"
  | "welcome"
  | "welcome_questions"
  | "welcome_files"
  | "welcome_questions_files";

export interface WelcomeFlowQuestion {
  id?: string;
  prompt: string;
  isRequired: boolean;
}

export interface WelcomeFlowFile {
  id: string;
  /** False for a portfolio row whose bytes were never linked — skipped when the flow fires. */
  hasBlob: boolean;
}

export interface WelcomeFlow {
  mode: WelcomeFlowMode;
  message: string | null;
  questions: WelcomeFlowQuestion[];
  files: WelcomeFlowFile[];
}

export interface SetWelcomeFlowInput {
  mode: WelcomeFlowMode;
  message?: string | null;
  questions?: { prompt: string; isRequired?: boolean }[];
  /** `VendorFile` ids from this studio's own portfolio, not raw upload ids. */
  fileIds?: string[];
}

export interface MergeField {
  token: string;
  label: string;
  example: string;
}
