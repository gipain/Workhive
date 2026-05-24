/**
 * Extracts a human-readable error message from an axios error.
 * FastAPI may return detail as:
 *   - string  (HTTPException)
 *   - array of {loc, msg, type, input, ctx}  (Pydantic 422)
 */
export function getApiErrorMessage(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((e: { msg?: string; loc?: string[] }) => {
        const field = e.loc ? e.loc.filter((s) => s !== 'body').join('.') : '';
        const message = e.msg ?? 'невідома помилка';
        return field ? `${field}: ${message}` : message;
      })
      .join('; ');
  }

  return 'Помилка. Спробуйте ще раз.';
}
