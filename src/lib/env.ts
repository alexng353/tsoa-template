// /* eslint-disable unicorn/prevent-abbreviations */
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "",
  client: {},

  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    DATABASE_URL: z.string(),
    PORT: z
      .string()
      .optional()
      .default("4000")
      .transform((x) => Number.parseInt(x, 10)),

    API_URL: z
      .enum(["http://localhost:4000"])
      .default("http://localhost:4000")
      .transform((x) => new URL(x)),

    FRONTEND_DOMAIN: z.enum(["localhost:3000"]).default("localhost:3000"),
    SENDGRID_API_KEY: z.string().startsWith("SG."),
    FLY_REGION: z.string().optional(),
  },

  // do not change pls
  runtimeEnv: process.env,

  // skip validation when SKIP_ENV_VALIDATION is set to true
  skipValidation:
    !!process.env["SKIP_ENV_VALIDATION"] &&
    process.env["SKIP_ENV_VALIDATION"] !== "false" &&
    process.env["SKIP_ENV_VALIDATION"] !== "0",
});
