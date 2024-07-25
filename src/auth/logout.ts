import { Sessions } from "@app/schema/session.schema";
import { db } from "@lib/db";
import { logger } from "@lib/logger";
import { eq } from "drizzle-orm";
import { Response as ExpressResponse } from "express";
import {
  FRONTEND_COOKIE_NAME,
  FRONTEND_COOKIE_OPTIONS,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "./constants";

type Extras = {
  reason?: string;
} & Record<string, unknown>;
export async function LogOut(
  response: ExpressResponse,
  session_id: string | null,
  extras: Extras,
): Promise<void> {
  logger.info({
    event: "auth:logout_function",
    session_id,
    msg: "Logging out a user",
    ...extras,
  });

  if (session_id) {
    await db
      .update(Sessions)
      .set({
        force_expire: true,
        reason_force_expire: "User Logged Out",
      })
      .where(eq(Sessions.id, session_id))
      .catch((error) => {
        logger.error(error, "Failed to update session");
        throw new Error("Failed to update session", {
          cause: error,
        });
      });
  }
  response.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
  response.clearCookie(FRONTEND_COOKIE_NAME, FRONTEND_COOKIE_OPTIONS);
}
