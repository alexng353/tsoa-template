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

export const SESSION_COOKIE_OPTIONS = IS_PRODUCTION
  ? ({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      domain: env.API_URL.hostname,
      expires: thirtyDaysFromNow(),
      path: "/",
    } as const)
  : ({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      domain: "localhost",
      expires: thirtyDaysFromNow(),
      path: "/",
    } as const);

export const FRONTEND_COOKIE_OPTIONS = IS_PRODUCTION
  ? ({
      httpOnly: false,
      secure: true,
      sameSite: "strict",
      domain: `.${env.FRONTEND_DOMAIN.host.split(".").slice(-2).join(".")}`,
      expires: thirtyDaysFromNow(),
      path: "/",
    } as const)
  : ({
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      domain: "localhost",
      expires: thirtyDaysFromNow(),
      path: "/",
    } as const);
