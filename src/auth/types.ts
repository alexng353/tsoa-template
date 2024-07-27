import { env } from "@lib/env";
import { z } from "zod";

/** @deprecated You can't use this in tsoa so just manually paste it in. */
export type RedirectQuery = {
  success_url: string;
  error_url: string;
};

export const Z_RedirectQuery = z.object({
  success_url: z
    .string()
    .url()
    .optional()
    .default(env.FRONTEND_URL.toString() + "dashboard")
    .transform((url) => new URL(url)),
  error_url: z
    .string()
    .url()
    .optional()
    .default(env.FRONTEND_URL.toString() + "error")
    .transform((url) => new URL(url)),
});
