import argon2 from "@node-rs/argon2";
import { Body, Header, Post, Queries, Query, Res, Route } from "tsoa";
import { eq, or } from "drizzle-orm";
import * as jose from "jose";

import { logger } from "@lib/logger";
import { DAY } from "@lib/constants";
import { ErrorBadRequest } from "@lib/status/error";
import { LogOut } from "../logout";
import { db, getFirst } from "@lib/db";
import { Sessions, Users } from "@app/schema";
import {
  FRONTEND_COOKIE_NAME,
  FRONTEND_COOKIE_OPTIONS,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "../constants";

import { Z_RedirectQuery } from "../types";
import { env } from "@lib/env";
import { JWS_SECRET } from "../jwt-helpers";
import { NController } from "@lib/ncontroller";

type LoginBody = {
  username: string;
  password: string;
};

@Route("/auth/v1/login")
export class LoginPasswordController extends NController {
  @Post("/password")
  async login_password(
    @Body() body: LoginBody,
    @Queries()
    _query: {
      success_url: string;
      error_url: string;
    },
  ) {
    const { success_url, error_url } = Z_RedirectQuery.parse(_query);

    const ip_address = this.getRealIp();
    try {
      this.clearCookie(SESSION_COOKIE_NAME);
      this.clearCookie(FRONTEND_COOKIE_NAME);

      // TODO: EDU-2241: Check IP Address on login

      const user = await db
        .select()
        .from(Users)
        .where(
          or(eq(Users.username, body.username), eq(Users.email, body.username)),
        )
        .then(getFirst);

      if (!user) {
        // response.redirect(error_url + "?error=user_not_found");
        return;
      }

      const is_valid = await argon2.verify(user.password_hash, body.password);

      if (!is_valid) {
        // response.redirect(error_url + "?error=invalid_password");
        return;
      }

      const iat = new Date();
      const exp = new Date(iat.getTime() + 30 * DAY); // 30 days
      const session = await db
        .insert(Sessions)
        .values({
          user_id: user.id,
          created_at: iat,
          expires_at: exp,
          ip_address: ip_address,
        })
        .returning()
        .then(getFirst);

      if (!session) {
        throw new ErrorBadRequest("Failed to create session");
      }
      const fe_jwt = await new jose.SignJWT()
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(user.id)

        .setIssuedAt(iat)
        .setExpirationTime(exp)

        .setIssuer(env.API_URL.toString())
        .setAudience(env.FRONTEND_URL.toString())
        .setJti(crypto.randomUUID())
        .sign(JWS_SECRET);

      this.setCookie(SESSION_COOKIE_NAME, session.id, SESSION_COOKIE_OPTIONS);
      this.setCookie(FRONTEND_COOKIE_NAME, fe_jwt, FRONTEND_COOKIE_OPTIONS);

      logger.info({
        event: "auth:login_password",
        user_id: user.id,
        ip_address,
        msg: "User logged in successfully",
      });

      // response.redirect(success_url + "?login=successful");
    } catch (error) {
      logger.error({ err: error }, "Error in login_password");
      // response.redirect(error_url + "?error=auth_failed");
    }
  }
}
