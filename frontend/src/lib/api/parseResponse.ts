import type { ZodType } from "zod";

/**
 * Reads a JSON response and validates it against a schema.
 *
 * `Response.json()` is typed `any`, so a declared return type alone proves
 * nothing: if the backend renames a field, TypeScript stays silent and the
 * mismatch surfaces later as an undefined deep inside a component. Validating
 * at the boundary turns that into an error at the point of entry, naming the
 * field that is wrong.
 */
export async function parseJsonResponse<T>(
  response: Response,
  schema: ZodType<T>,
  context: string,
): Promise<T> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error(`${context}: the response was not valid JSON.`);
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");

    throw new Error(`${context}: unexpected response shape. ${detail}`);
  }

  return result.data;
}
