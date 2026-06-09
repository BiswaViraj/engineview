// Pull a readable message out of a failed $fetch error, handling both our own
// API errors ({ statusMessage } / { error }) and the Analytics Engine error
// shape ({ errors: [{ code, message }] }).
export function extractApiError(e: unknown): string {
  const data = (
    e as {
      data?: {
        errors?: { code?: number; message?: string }[];
        error?: string;
        statusMessage?: string;
      };
    }
  )?.data;
  if (data?.errors?.length) return data.errors.map((x) => x.message ?? `code ${x.code}`).join("\n");
  if (data?.error) return data.error;
  if (data?.statusMessage) return data.statusMessage;
  return (e as Error)?.message || "Request failed.";
}
