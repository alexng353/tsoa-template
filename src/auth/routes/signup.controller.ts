import { Body, Post, Queries, Response, Route } from "tsoa";
import argon2 from "@node-rs/argon2";
import * as jose from "jose";

import { OTP } from "../otp";
import { Users } from "@app/schema/user.schema";
import { db, getFirst } from "@lib/db";
import { InternalServerError } from "@lib/status/error";
import { DAY } from "@lib/constants";
import { Sessions } from "@app/schema/session.schema";
import {
  FRONTEND_COOKIE_NAME,
  FRONTEND_COOKIE_OPTIONS,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "../constants";
import { logger } from "@lib/logger";
import { env } from "@lib/env";
import { JWS_SECRET } from "../jwt-helpers";
import { Z_RedirectQuery } from "../types";
import { NController } from "@lib/ncontroller";
import { OTPCode } from "@app/types";

type SignupBody = {
  username: string;
  password: string;
  email: string;
  code: OTPCode;
};

@Route("/auth/v1/signup")
export class AuthController extends NController {
  @Post("/password")
  @Response<void>(302, "Redirect to success_url or error_url")
  public async signup(
    @Body() body: SignupBody,
    @Queries()
    _query: {
      success_url?: string;
      error_url?: string;
    },
  ): Promise<void> {
    const { success_url, error_url } = Z_RedirectQuery.parse(_query);

    const ip_address = this.getRealIp();
    try {
      // Logout any existing sessions
      this.clearCookie(SESSION_COOKIE_NAME);
      this.clearCookie(FRONTEND_COOKIE_NAME);

      await OTP.burnOTP(body.email, body.code).catch((error) => {
        throw new Error("Failed to verify email", {
          cause: error,
        });
      });

      const hash = await argon2.hash(body.password);

      const user = await db
        .insert(Users)
        .values({
          email: body.email,
          username: body.username,
          // TODO: Add real name to body (?)
          name: "",
          password_hash: hash,
          known_ips: ip_address ? [ip_address] : [],
          is_email_verified: true,
        })
        .returning()
        .then(getFirst)
        .catch((error) => {
          console.error(error);
          throw new InternalServerError("Failed to create user", {
            cause: error,
          });
        });

      if (!user) {
        throw new Error("Failed to create user");
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
        throw new InternalServerError("Failed to create session");
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
        event: "auth:signup_password",
        user_id: user.id,
        ip_address,
        msg: "User signed up successfully",
      });

      this.redirect(success_url.toString() + "?signup=successful");
    } catch (error) {
      logger.error({ err: error }, "Error in signup_password");
      this.redirect(error_url.toString() + "?error=auth_failed");
    }
    return;
  }
}
