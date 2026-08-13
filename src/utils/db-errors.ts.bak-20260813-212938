export const isUndefinedTableError = (error: unknown): boolean => {
  const seen = new Set<unknown>();
  const queue: unknown[] = [error];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);

    const candidate = current as {
      code?: string;
      message?: string;
      cause?: unknown;
      originalError?: unknown;
    };

    if (
      candidate.code === "42P01" ||
      /relation .* does not exist/i.test(candidate.message ?? "")
    ) {
      return true;
    }

    if (candidate.cause) queue.push(candidate.cause);
    if (candidate.originalError) queue.push(candidate.originalError);
  }

  return false;
};
