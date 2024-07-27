import { DAY, IS_PRODUCTION } from "@lib/constants";
import { env } from "@lib/env";

export const SESSION_COOKIE_NAME = IS_PRODUCTION
  ? "__Secure-edubeyond-session-token"
  : "edubeyond-session-token";

export const FRONTEND_COOKIE_NAME = IS_PRODUCTION
  ? "__Secure-edubeyond-frontend-token"
  : "edubeyond-frontend-token";

function thirtyDaysFromNow() {
  return new Date(Date.now() + 30 * DAY);
}

export type CookieOptions = {
  HttpOnly?: boolean;
  Secure?: boolean;
  SameSite?: "strict" | "lax" | "none";
  Domain?: string;
  Expires?: Date;
  Path?: string;
};

export const SESSION_COOKIE_OPTIONS: CookieOptions = IS_PRODUCTION
  ? ({
      HttpOnly: true,
      Secure: true,
      SameSite: "strict",
      Domain: env.API_URL.hostname,
      Expires: thirtyDaysFromNow(),
      Path: "/",
    } as const)
  : ({
      HttpOnly: true,
      Secure: false,
      SameSite: "lax",
      Domain: "localhost",
      Expires: thirtyDaysFromNow(),
      Path: "/",
    } as const);

export const FRONTEND_COOKIE_OPTIONS: CookieOptions = IS_PRODUCTION
  ? ({
      HttpOnly: false,
      Secure: true,
      SameSite: "strict",
      Domain: `.${env.FRONTEND_URL.host.split(".").slice(-2).join(".")}`,
      Expires: thirtyDaysFromNow(),
      Path: "/",
    } as const)
  : ({
      HttpOnly: false,
      Secure: false,
      SameSite: "lax",
      Domain: "localhost",
      Expires: thirtyDaysFromNow(),
      Path: "/",
    } as const);

export const EXPRESS_FRONTEND_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: IS_PRODUCTION,
  sameSite: "strict",
  domain: IS_PRODUCTION
    ? `.${env.FRONTEND_URL.host.split(".").slice(-2).join(".")}`
    : "localhost",
  expires: thirtyDaysFromNow(),
  path: "/",
} as const;

export function createCookieString(
  name: string,
  value: string,
  options: Record<string, unknown>,
) {
  const optionsString = Object.entries(options)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

  return `${name}=${value}; ${optionsString}`;
}
