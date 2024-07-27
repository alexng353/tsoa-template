import { REALIP_HEADER } from "@lib/constants";
import { env } from "@lib/env";
import { logger } from "@lib/logger";
import type { NextFunction, Request, Response } from "express";
import * as jose from "jose";
import { JWS_SECRET } from "./jwt-helpers";
import { LogOut } from "./logout";
import {
  EXPRESS_FRONTEND_COOKIE_OPTIONS,
  FRONTEND_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "./constants";
import { db, getFirst } from "@lib/db";
import { Sessions } from "@app/schema/session.schema";
import { eq } from "drizzle-orm";
import { Users } from "@app/schema/user.schema";

/**
 * Authentication middleware. Does **NOT** guard against unauthenticated
 * Requests. It only sets the `request.user` field to the user object if the
 * user is authenticated.
 *
 * If the user is not authenticated, `request.user` will be `null`.
 *
 * If you want to guard against unauthenticated requests, use the
 * `@ProtectRoute` decorator.
 */
export function auth() {
  return async (request: Request, response: Response, next: NextFunction) => {
    const ip_address = request.header(REALIP_HEADER);
    if (!ip_address && env.NODE_ENV === "production") {
      logger.warn({
        event: "auth:middleware:missing_real_ip",
        msg: "Missing fly-client-ip header",
        fly_ip: ip_address,
        x_forwarded_for: request.header("x-forwarded-for"),
      });
      return response.status(400).json({
        error: "Missing fly-client-ip header",
      });
    }

    // Initially set to null so we don't forget later
    request.user = null;
    request.session = null;
    request.user_password = null;

    const session_id =
      request.cookies[SESSION_COOKIE_NAME] ??
      request.header("authorization")?.replace("Bearer ", "");

    if (!session_id || typeof session_id !== "string") {
      return next();
    }

    const session = await db
      .select({
        user: Users,
        user_id: Sessions.user_id,
        id: Sessions.id,
        created_at: Sessions.created_at,
        expires_at: Sessions.expires_at,
        ip_address: Sessions.ip_address,

        force_expire: Sessions.force_expire,
        reason_force_expire: Sessions.reason_force_expire,
      })
      .from(Sessions)
      .where(eq(Sessions.id, session_id))
      .leftJoin(Users, eq(Sessions.user_id, Users.id))
      .then(getFirst);

    if (!session || !session.user) {
      return next();
    }

    // TODO: reenable this after fixing the real-ip issue
    // if (session.ip !== ip_address && env.NODE_ENV === "production") {
    //   const ERR_MSG = "Session IP address does not match request IP address";
    //   await LogOut(response, session_id, {
    //     reason: ERR_MSG,
    //     ip_address,
    //     session_ip: session.ip,
    //   });
    //   return response.status(401).json({
    //     error: ERR_MSG,
    //   });
    // }

    if (new Date() > session.expires_at) {
      await LogOut(response, session_id, {
        reason: "Session has expired",
      });
      return response.status(401).json({
        error: "Session has expired",
      });
    }

    async function refresh_frontend_token() {
      const user_id = session?.user?.id;
      if (!user_id) throw new Error("User ID is missing");

      logger.info({
        event: "auth:middleware:refresh_frontend_token",
        user_id,
        ip_address,
        msg: "Refreshing frontend token",
      });
      const new_fe_cookie = await new jose.SignJWT()
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(user_id)

        .setIssuedAt()
        .setExpirationTime("30d")

        .setIssuer(env.API_URL.toString())
        .setAudience(env.FRONTEND_URL.toString())
        .setJti(crypto.randomUUID())
        .sign(JWS_SECRET);
      response.cookie(
        FRONTEND_COOKIE_NAME,
        new_fe_cookie,
        EXPRESS_FRONTEND_COOKIE_OPTIONS,
      );
    }

    const fe_cookie = request.cookies[FRONTEND_COOKIE_NAME];

    const { payload: claims } = await jose
      .jwtVerify(fe_cookie, JWS_SECRET)
      .catch((error) => {
        logger.error({
          event: "auth:middleware:jwt_verify_error",
          msg: "Error verifying JWT",
          error: error,
        });
        return { payload: null };
      });

    // prettier-ignore
    // it's cleaner
    const is_about_to_expire =
      claims?.exp !== undefined && 
      claims.exp - Date.now() / 1000 < 5 * 60;

    if (!claims || is_about_to_expire) {
      refresh_frontend_token();
    }

    const { user, ...session_no_user } = session;
    // pull password so it's impossible to accidentally leak it
    // password is also an argon2id so it's not a big deal, but still
    const { password_hash, ...user_no_password } = user;

    request.user = user_no_password;
    request.user_password = password_hash;

    request.session = session_no_user;

    logger.trace({
      event: "auth:middleware:authenticated",
      user_id: session.user.id,
      ip_address,
      msg: "User authenticated",
      session_id,
      path: request.path,
    });

    next();
  };
}
