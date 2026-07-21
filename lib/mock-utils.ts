export const mockDelay = (ms = 350): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mockId = (): string => Math.random().toString(36).slice(2, 10);
