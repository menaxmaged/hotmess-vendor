/**
 * Automation Feature - Mock Data
 */

import { mockDelay, mockId } from "@/lib/mock-utils";
import type {
    AutoAssignRule,
    CreateRuleInput,
    MergeField,
    SetWelcomeFlowInput,
    UpdateRuleInput,
    WelcomeFlow,
} from "./types";

const rules: AutoAssignRule[] = [
  {
    id: "rule-1",
    name: "Cairo weddings to Sara",
    criteria: { leadSource: ["explore", "ad"] },
    assignToMemberId: "tm-1",
    displayOrder: 0,
    isActive: true,
    firedCount: 12,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

let welcomeFlow: WelcomeFlow = {
  mode: "welcome",
  message:
    'Hi {bride_name}! Thanks for reaching out about your {occasion} on {date}. We’d love to help — a few quick questions and we’ll send you our packages ✨',
  questions: [
    { id: "q1", prompt: 'What is your estimated guest count?', isRequired: false },
    { id: "q2", prompt: 'What is your budget range?', isRequired: false },
    { id: "q3", prompt: 'Which package caught your eye?', isRequired: false },
  ],
  files: [],
};

const mergeFields: MergeField[] = [
  { token: "{bride_name}", label: "Client name", example: "Nour" },
  { token: "{groom_name}", label: "Partner name", example: "Karim" },
  { token: "{occasion}", label: "Occasion", example: "Henna night" },
  { token: "{date}", label: "Event date", example: "12 Sep 2026" },
  { token: "{location}", label: "Location", example: "Cairo" },
];

export const mockAutomationApi = {
  getRules: async (): Promise<AutoAssignRule[]> => {
    await mockDelay();
    return [...rules];
  },

  createRule: async (input: CreateRuleInput): Promise<AutoAssignRule> => {
    await mockDelay(250);
    const rule: AutoAssignRule = {
      id: mockId(),
      name: input.name,
      criteria: input.criteria,
      assignToMemberId: input.assignToMemberId ?? null,
      displayOrder: input.displayOrder ?? rules.length,
      isActive: input.isActive ?? true,
      firedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    rules.push(rule);
    return rule;
  },

  updateRule: async (input: UpdateRuleInput): Promise<void> => {
    await mockDelay(200);
    const rule = rules.find((r) => r.id === input.ruleId);
    if (!rule) throw new Error(`Mock rule not found: ${input.ruleId}`);
    if (input.name !== undefined) rule.name = input.name;
    if (input.criteria !== undefined) rule.criteria = input.criteria;
    if (input.assignToMemberId !== undefined) rule.assignToMemberId = input.assignToMemberId;
    if (input.displayOrder !== undefined) rule.displayOrder = input.displayOrder;
    if (input.isActive !== undefined) rule.isActive = input.isActive;
    rule.updatedAt = new Date().toISOString();
  },

  deleteRule: async (ruleId: string): Promise<void> => {
    await mockDelay(200);
    const index = rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) rules.splice(index, 1);
  },

  getWelcomeFlow: async (): Promise<WelcomeFlow> => {
    await mockDelay();
    return { ...welcomeFlow };
  },

  setWelcomeFlow: async (input: SetWelcomeFlowInput): Promise<WelcomeFlow> => {
    await mockDelay(300);
    welcomeFlow = {
      mode: input.mode,
      message: input.message ?? null,
      questions: (input.questions ?? []).map((q) => ({
        prompt: q.prompt,
        isRequired: q.isRequired ?? false,
      })),
      files: [],
    };
    return { ...welcomeFlow };
  },

  getMergeFields: async (): Promise<MergeField[]> => {
    await mockDelay(150);
    return mergeFields;
  },
};
