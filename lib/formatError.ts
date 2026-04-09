type ErrorWithMetadata = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string;
};

export function formatError(error: unknown, fallback: string): string {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    const metadata = error as ErrorWithMetadata;
    const parts = [error.message];

    if (metadata.details) {
      parts.push(metadata.details);
    }

    if (metadata.hint) {
      parts.push(`Hint: ${metadata.hint}`);
    }

    if (metadata.code) {
      parts.push(`Code: ${metadata.code}`);
    }

    return parts.filter(Boolean).join(' ');
  }

  return fallback;
}
