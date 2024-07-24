import { z } from "zod";
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface JSON {
    /**
     * @param text JSON string
     * @param schema  Zod schema
     * @returns T
     *
     * @description
     * 1. Parses JSON string
     * 2. Validates against Zod schema
     * 3. Returns T
     *
     * @throws Error if JSON does not match provided schema
     */
    zparse<T>(text: string, schema: z.ZodType<T>): T;
    /**
     * @param text JSON string
     * @param schema  Zod schema
     * @returns T | null
     *
     * @description
     * 1. Parses JSON string
     * 2. Validates against Zod schema
     * 3. Returns T | null
     *
     * if JSON is invalid, returns null
     */
    zparse_safe<T>(text: string, schema: z.ZodType<T>): T | null;
  }
}

function validate_json_parse<T>(json: string, schema: z.ZodType<T>) {
  try {
    const parsed = JSON.parse(json);
    const validated = schema.parse(parsed);
    return validated;
  } catch (error) {
    throw new Error("JSON does not match provided schema.", {
      cause: error,
    });
  }
}

function safe_validate_json_parse<T>(
  json: string,
  schema: z.ZodType<T>,
): T | null {
  try {
    const parsed = JSON.parse(json);
    const validated = schema.parse(parsed);
    return validated;
  } catch {
    return null;
  }
}

JSON.zparse = validate_json_parse;
JSON.zparse_safe = safe_validate_json_parse;
