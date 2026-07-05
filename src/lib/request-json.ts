/**
 * `request.json()` throws a raw SyntaxError on an empty or malformed body,
 * which — left uncaught — surfaces as an unhandled exception instead of a
 * clean 400. Every route that parses a JSON body should go through this.
 */
export async function parseJsonBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
