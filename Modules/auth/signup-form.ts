/**
 * Vendor sign-up form logic, driven entirely by GET /v1/vendor/signup-schema.
 *
 * `visibleWhen` may only reference a field that appears EARLIER in the
 * document, so visibility is resolved in one pass in document order. A field
 * whose own condition fails is hidden, and a hidden field's answer never
 * satisfies a later clause. Hidden fields are never required.
 */

import i18n from "@/lib/i18n";

import type { SignupSchemaField, SignupSchemaStep, SignupVisibleClause } from "./types";

export type SignupAnswerValue = string | boolean | string[];
export type SignupAnswers = Record<string, SignupAnswerValue | undefined>;

const same = (a: unknown, b: unknown) => String(a) === String(b);

const isEmpty = (value: SignupAnswerValue | undefined) =>
  value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

function clauseMatches(clause: SignupVisibleClause, value: SignupAnswerValue | undefined): boolean {
  const list = Array.isArray(value) ? value : value === undefined ? [] : [value];
  if ("equals" in clause) return list.some((v) => same(v, clause.equals));
  if ("notEquals" in clause) return !list.some((v) => same(v, clause.notEquals));
  if ("in" in clause && Array.isArray(clause.in)) return list.some((v) => clause.in!.some((c) => same(v, c)));
  if ("notIn" in clause && Array.isArray(clause.notIn)) return !list.some((v) => clause.notIn!.some((c) => same(v, c)));
  // An operator this client doesn't know: show the field rather than hide
  // something the server might require.
  return true;
}

/** Keys of every field currently visible, in document order. */
export function visibleFieldKeys(steps: SignupSchemaStep[], answers: SignupAnswers): Set<string> {
  const visible = new Set<string>();
  for (const step of steps) {
    for (const field of step.fields) {
      const clauses = field.visibleWhen
        ? Array.isArray(field.visibleWhen)
          ? field.visibleWhen
          : [field.visibleWhen]
        : [];
      const shown = clauses.every((clause) =>
        clauseMatches(clause, visible.has(clause.field) ? answers[clause.field] : undefined),
      );
      if (shown) visible.add(field.key);
    }
  }
  return visible;
}

const EMAIL = /^\S+@\S+\.\S+$/;
const URL_RE = /^https?:\/\/\S+\.\S+/i;
const PHONE = /^\+?[0-9\s-]{7,20}$/;

/** Returns an error message, or null when the value is acceptable. */
export function validateField(field: SignupSchemaField, value: SignupAnswerValue | undefined): string | null {
  if (field.type === "boolean") return null; // always answered (defaults to off)
  if (isEmpty(value)) return field.required ? i18n.t("auth:signup.errors.required") : null;

  const { min, max } = field;
  switch (field.type) {
    case "email":
      return EMAIL.test(String(value).trim()) ? null : i18n.t("auth:signup.errors.email");
    case "url":
      return URL_RE.test(String(value).trim()) ? null : i18n.t("auth:signup.errors.url");
    case "phone":
      return PHONE.test(String(value).trim()) ? null : i18n.t("auth:signup.errors.phone");
    case "number": {
      const n = Number(value);
      if (!Number.isFinite(n)) return i18n.t("auth:signup.errors.number");
      if (min != null && n < min) return i18n.t("auth:signup.errors.minNumber", { min });
      if (max != null && n > max) return i18n.t("auth:signup.errors.maxNumber", { max });
      return null;
    }
    case "select":
      return field.options?.some((o) => o.value === value) ? null : i18n.t("auth:signup.errors.choose");
    case "multiselect": {
      const count = Array.isArray(value) ? value.length : 0;
      if (min != null && count < min) return i18n.t("auth:signup.errors.minChoices", { min });
      if (max != null && count > max) return i18n.t("auth:signup.errors.maxChoices", { max });
      return null;
    }
    default: {
      const length = String(value).trim().length;
      if (min != null && length < min) return i18n.t("auth:signup.errors.minLength", { min });
      if (max != null && length > max) return i18n.t("auth:signup.errors.maxLength", { max });
      return null;
    }
  }
}

/** Errors for the visible fields of one step, keyed by field key. */
export function stepErrors(
  step: SignupSchemaStep,
  visible: Set<string>,
  answers: SignupAnswers,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of step.fields) {
    if (!visible.has(field.key)) continue;
    const error = validateField(field, answers[field.key]);
    if (error) errors[field.key] = error;
  }
  return errors;
}

/** The `answers` body: visible, non-empty fields only, numbers as numbers, text trimmed. */
export function cleanAnswers(steps: SignupSchemaStep[], answers: SignupAnswers): Record<string, unknown> {
  const visible = visibleFieldKeys(steps, answers);
  const out: Record<string, unknown> = {};
  for (const step of steps) {
    for (const field of step.fields) {
      const value = answers[field.key];
      if (!visible.has(field.key)) continue;
      if (field.type === "boolean") {
        out[field.key] = value === true;
        continue;
      }
      if (isEmpty(value)) continue;
      if (field.type === "number") out[field.key] = Number(value);
      else if (typeof value === "string") out[field.key] = value.trim();
      else out[field.key] = value;
    }
  }
  return out;
}
