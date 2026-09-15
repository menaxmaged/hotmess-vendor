/**
 * Shape of a non-English translation file: every key of the English file,
 * each a string. Extra keys are allowed because Arabic needs more plural
 * forms (`_zero`, `_two`, `_few`, `_many`) than English's `_one` / `_other`.
 */
export type Translation<T> = {
  [K in keyof T]: T[K] extends string ? string : Translation<T[K]>;
} & { [extra: string]: unknown };
