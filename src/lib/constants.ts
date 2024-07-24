import { env } from "./env";

/** milliseconds in a second */
export const SECOND = 1000 as const;

/** milliseconds in a minute */
export const MINUTE = 60_000 as const;

/** milliseconds in an hour */
export const HOUR = 3_600_000 as const;

/** milliseconds in a day */
export const DAY = 86_400_000 as const;

/** env.NODE_ENV === "production" */
export const IS_PRODUCTION = env.NODE_ENV === "production";

export const CHATBOT_URL = IS_PRODUCTION
  ? ("https://backbone-production.up.railway.app" as const)
  : ("http://127.0.0.1:6969" as const);

/** The header key for the real IP address. */
export const REALIP_HEADER = "fly-client-ip" as const;
